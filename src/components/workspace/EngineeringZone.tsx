import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Lock, Unlock, FileText, Image, Box, Clock, Download, History } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EngineeringZoneProps {
    projectId: string;
}

interface FileItem {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    version: number;
    is_latest: boolean;
    is_locked: boolean;
    locked_by: string | null;
    locked_at: string | null;
    updated_at: string;
    uploaded_by: string;
    uploader?: { name: string };
    locker?: { name: string };
}

export const EngineeringZone = ({ projectId }: EngineeringZoneProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchFiles();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel(`files:${projectId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'files',
                filter: `project_id=eq.${projectId}`
            }, () => {
                fetchFiles();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [projectId]);

    const fetchFiles = async () => {
        try {
            const { data, error } = await supabase
                .from('files')
                .select(`
          *,
          uploader:uploaded_by(name),
          locker:locked_by(name)
        `)
                .eq('project_id', projectId)
                .eq('is_latest', true)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setFiles(data || []);
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            // 1. Check if file exists to determine version
            const { data: existingFiles } = await supabase
                .from('files')
                .select('version, id')
                .eq('project_id', projectId)
                .eq('file_name', file.name)
                .eq('is_latest', true)
                .single();

            const newVersion = existingFiles ? existingFiles.version + 1 : 1;
            const parentId = existingFiles ? existingFiles.id : null;

            // 2. Upload file to storage
            const filePath = `${projectId}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 3. Archive old version if exists
            if (existingFiles) {
                await supabase
                    .from('files')
                    .update({ is_latest: false })
                    .eq('id', existingFiles.id);
            }

            // 4. Insert new file record
            const { data: newFile, error: dbError } = await supabase
                .from('files')
                .insert({
                    project_id: projectId,
                    file_name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    mime_type: file.type,
                    uploaded_by: user.id,
                    version: newVersion,
                    is_latest: true,
                    parent_id: parentId
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 5. Log activity
            await supabase.from('activity_logs').insert({
                project_id: projectId,
                user_id: user.id,
                action_type: 'FILE_UPLOAD',
                entity_type: 'FILE',
                entity_id: newFile.id,
                details: {
                    file_name: file.name,
                    version: newVersion,
                    size: file.size
                }
            });

            toast({
                title: 'File uploaded',
                description: `${file.name} (v${newVersion}) uploaded successfully.`,
            });

        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                variant: 'destructive',
                title: 'Upload failed',
                description: error.message,
            });
        } finally {
            setIsUploading(false);
            // Reset input
            event.target.value = '';
        }
    };

    const toggleLock = async (file: FileItem) => {
        if (!user) return;

        try {
            const newLockState = !file.is_locked;

            // Update file lock status
            const { error } = await supabase
                .from('files')
                .update({
                    is_locked: newLockState,
                    locked_by: newLockState ? user.id : null,
                    locked_at: newLockState ? new Date().toISOString() : null
                })
                .eq('id', file.id);

            if (error) throw error;

            // Log activity
            await supabase.from('activity_logs').insert({
                project_id: projectId,
                user_id: user.id,
                action_type: newLockState ? 'FILE_LOCK' : 'FILE_UNLOCK',
                entity_type: 'FILE',
                entity_id: file.id,
                details: {
                    file_name: file.file_name
                }
            });

            toast({
                title: newLockState ? 'File Locked' : 'File Unlocked',
                description: newLockState
                    ? `${file.file_name} is now locked for editing.`
                    : `${file.file_name} is now available for editing.`,
            });

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Action failed',
                description: error.message,
            });
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('image')) return <Image className="h-4 w-4" />;
        if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
        return <Box className="h-4 w-4" />;
    };

    return (
        <div className="flex flex-col h-full p-4 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Engineering Files</h3>
                    <p className="text-sm text-muted-foreground">Manage CAD files, schematics, and documentation.</p>
                </div>
                <div className="flex gap-2">
                    <Input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                    <Button asChild disabled={isUploading}>
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploading ? 'Uploading...' : 'Upload File'}
                        </label>
                    </Button>
                </div>
            </div>

            <div className="border rounded-md flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {files.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No files uploaded yet. Start by uploading a file.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                files.map((file) => (
                                    <TableRow key={file.id}>
                                        <TableCell>{getFileIcon(file.mime_type)}</TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{file.file_name}</span>
                                                <span className="text-xs text-muted-foreground">by {file.uploader?.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono">v{file.version}</Badge>
                                        </TableCell>
                                        <TableCell>{formatBytes(file.file_size)}</TableCell>
                                        <TableCell>
                                            {file.is_locked ? (
                                                <div className="flex items-center text-amber-600 text-xs font-medium">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    In use by {file.locker?.name}
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-muted-foreground text-xs">
                                                    <Unlock className="h-3 w-3 mr-1" />
                                                    Available
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(file.updated_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant={file.is_locked ? "destructive" : "outline"}
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() => toggleLock(file)}
                                                    disabled={file.is_locked && file.locked_by !== user?.id}
                                                >
                                                    {file.is_locked ? (
                                                        file.locked_by === user?.id ? 'Unlock' : 'Locked'
                                                    ) : (
                                                        'Start Working'
                                                    )}
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <History className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Download className="h-4 w-4 mr-2" /> Download Latest
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <History className="h-4 w-4 mr-2" /> View History
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
};
