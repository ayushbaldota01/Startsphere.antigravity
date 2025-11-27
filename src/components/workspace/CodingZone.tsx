import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Folder, FileCode, Save, GitBranch, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodingZoneProps {
    projectId: string;
}

// Mock file tree data for now
const MOCK_FILE_TREE = [
    {
        name: 'src', type: 'folder', children: [
            {
                name: 'components', type: 'folder', children: [
                    { name: 'Button.tsx', type: 'file' },
                    { name: 'Header.tsx', type: 'file' },
                ]
            },
            { name: 'App.tsx', type: 'file' },
            { name: 'main.tsx', type: 'file' },
        ]
    },
    { name: 'package.json', type: 'file' },
    { name: 'README.md', type: 'file' },
];

export const CodingZone = ({ projectId }: CodingZoneProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleFileSelect = (fileName: string) => {
        setSelectedFile(fileName);
        // Mock content loading
        setFileContent(`// Content for ${fileName}\n\nexport const ${fileName.split('.')[0]} = () => {\n  return <div>Hello World</div>;\n};`);
    };

    const handleSave = async () => {
        if (!selectedFile || !user) return;

        setIsSaving(true);
        try {
            // In a real app, this would push to the git repo
            // For now, we just log the activity

            await supabase.from('activity_logs').insert({
                project_id: projectId,
                user_id: user.id,
                action_type: 'CODE_PUSH',
                entity_type: 'REPO',
                details: {
                    file_path: selectedFile,
                    commit_message: `Update ${selectedFile}`
                }
            });

            toast({
                title: 'Changes Pushed',
                description: `Successfully pushed updates to ${selectedFile}`,
            });

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Push Failed',
                description: error.message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const renderTree = (items: any[], level = 0) => {
        return items.map((item, index) => (
            <div key={index} style={{ paddingLeft: `${level * 12}px` }}>
                {item.type === 'folder' ? (
                    <div className="flex items-center py-1 text-sm text-muted-foreground font-medium">
                        <Folder className="h-4 w-4 mr-2 text-blue-500" />
                        {item.name}
                    </div>
                ) : (
                    <div
                        className={`flex items-center py-1 text-sm cursor-pointer hover:bg-accent rounded px-2 ${selectedFile === item.name ? 'bg-accent text-accent-foreground' : 'text-foreground'}`}
                        onClick={() => handleFileSelect(item.name)}
                    >
                        <FileCode className="h-4 w-4 mr-2 text-yellow-500" />
                        {item.name}
                    </div>
                )}
                {item.children && renderTree(item.children, level + 1)}
            </div>
        ));
    };

    return (
        <div className="flex h-full">
            {/* File Tree Sidebar */}
            <div className="w-64 border-r bg-muted/10 flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                    <span className="font-semibold text-sm flex items-center">
                        <GitBranch className="h-4 w-4 mr-2" />
                        Repository
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <RefreshCw className="h-3 w-3" />
                    </Button>
                </div>
                <ScrollArea className="flex-1 p-2">
                    {renderTree(MOCK_FILE_TREE)}
                </ScrollArea>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col bg-background">
                {selectedFile ? (
                    <>
                        <div className="h-10 border-b flex items-center justify-between px-4 bg-muted/5">
                            <span className="text-sm font-medium">{selectedFile}</span>
                            <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? 'Pushing...' : 'Save & Push'}
                            </Button>
                        </div>
                        <div className="flex-1 p-0">
                            <Textarea
                                value={fileContent}
                                onChange={(e) => setFileContent(e.target.value)}
                                className="h-full w-full resize-none border-0 rounded-none font-mono p-4 focus-visible:ring-0"
                                spellCheck={false}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <FileCode className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Select a file to view and edit</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
