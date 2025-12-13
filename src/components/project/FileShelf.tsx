import { useRef, useState } from 'react';
import { useFiles } from '@/hooks/useFiles';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Download, Trash2, FileIcon, FileText, Image, Video, Music, Archive, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { CompressionWarningDialog } from '@/components/ui/compression-warning-dialog';
import { optimizeFilesForUpload, shouldShowWarning } from '@/lib/fileCompression';
import { getFileCategory, isCompressibleImage } from '@/lib/fileTypeDetection';
import { useToast } from '@/hooks/use-toast';

interface FileShelfProps {
  projectId: string;
  readOnly?: boolean;
}

export const FileShelf = ({ projectId, readOnly = false }: FileShelfProps) => {
  const { user } = useAuth();
  const { 
    files, 
    isLoading, 
    isUploading, 
    uploadFile, 
    downloadFile, 
    deleteFile, 
    formatFileSize,
    uploadProgress,
    uploadStatus,
  } = useFiles(projectId);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { name: string; progress: number; status: string }>>(new Map());
  const [warningDialog, setWarningDialog] = useState<{
    open: boolean;
    file: File | null;
    pendingFiles: File[];
  }>({ open: false, file: null, pendingFiles: [] });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !user) return;

    const filesArray = Array.from(selectedFiles);

    // Check for files that need warning
    const filesNeedingWarning = filesArray.filter(shouldShowWarning);
    
    if (filesNeedingWarning.length > 0) {
      // Show warning for first file that needs it, but keep all files for processing
      setWarningDialog({ 
        open: true, 
        file: filesNeedingWarning[0],
        pendingFiles: filesArray 
      });
      // Reset input but don't upload yet
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Process files
    await processFiles(filesArray, user.id);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = async (filesArray: File[], userId: string) => {
    if (filesArray.length === 0) return;

    // Check if any files need compression (files >= 3MB and <= 20MB)
    const filesNeedingCompression = filesArray.filter(file => {
      const sizeMB = file.size / (1024 * 1024);
      const category = getFileCategory(file);
      return sizeMB >= 3 && sizeMB <= 20 && category === 'image' && isCompressibleImage(file);
    });

    // Only show compressing state if files actually need compression
    if (filesNeedingCompression.length > 0) {
      setIsCompressing(true);
    }

    try {
      // Optimize files (compression, bundling, etc.)
      // Small files (< 3MB) will be skipped automatically
      const optimizedResults = await optimizeFilesForUpload(filesArray, {
        skipSmallFiles: true,
        smallFileThresholdMB: 3,
        maxCompressSizeMB: 20,
        compressionTimeout: 30000, // 30 seconds timeout
        onProgress: (progress) => {
          // Optional: could show progress here
        },
      });

      // Upload each optimized file
      for (let i = 0; i < optimizedResults.length; i++) {
        const result = optimizedResults[i];
        const originalFile = filesArray[i] || filesArray[0];
        const uploadId = `${originalFile.name}-${Date.now()}-${i}`;

        // Track this upload
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.set(uploadId, { name: originalFile.name, progress: 0, status: 'Preparing...' });
          return newMap;
        });

        try {
          await uploadFile(
            result.file, 
            userId, 
            originalFile.name,
            (progress) => {
              // Update progress for this specific file
              setUploadingFiles(prev => {
                const newMap = new Map(prev);
                const current = newMap.get(uploadId);
                if (current) {
                  let status = `Uploading... ${progress}%`;
                  if (progress >= 100) {
                    status = 'Finalizing...';
                  }
                  newMap.set(uploadId, { ...current, progress, status });
                }
                return newMap;
              });
            }
          );

          // Update status to completed before removing
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(uploadId);
            if (current) {
              newMap.set(uploadId, { ...current, progress: 100, status: 'Complete!' });
            }
            return newMap;
          });

          // Remove from uploading files after a brief delay to show completion
          setTimeout(() => {
            setUploadingFiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(uploadId);
              return newMap;
            });
          }, 500);

          // Show compression feedback if file was compressed
          if (result.wasCompressed && result.compressionRatio > 0) {
            toast({
              title: 'File compressed',
              description: `${originalFile.name} reduced by ${result.compressionRatio.toFixed(1)}%`,
            });
          }
        } catch (uploadError: any) {
          console.error(`Failed to upload ${originalFile.name}:`, uploadError);
          
          // Update status to error before removing
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(uploadId);
            if (current) {
              newMap.set(uploadId, { ...current, progress: 0, status: 'Upload failed' });
            }
            return newMap;
          });

          // Remove from uploading files after showing error
          setTimeout(() => {
            setUploadingFiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(uploadId);
              return newMap;
            });
          }, 2000);
          
          // Continue with other files even if one fails
          toast({
            variant: 'destructive',
            title: 'Upload failed',
            description: `Failed to upload ${originalFile.name}. ${uploadError?.message || 'Please try again.'}`,
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to process files:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to process and upload files.';
      if (error?.message?.includes('timeout')) {
        errorMessage = 'Compression timed out. Uploading original file...';
        // Try to upload original files without compression
        try {
          for (const file of filesArray) {
            await uploadFile(file, userId, file.name);
          }
          toast({
            title: 'Upload completed',
            description: 'Files uploaded without compression due to timeout.',
          });
          return;
        } catch (uploadError) {
          errorMessage = 'Upload failed after compression timeout. Please try smaller files or upload without compression.';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: errorMessage,
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleWarningProceed = async () => {
    if (!warningDialog.pendingFiles || warningDialog.pendingFiles.length === 0 || !user) return;

    const filesArray = warningDialog.pendingFiles;
    setWarningDialog({ open: false, file: null, pendingFiles: [] });

    await processFiles(filesArray, user.id);
  };

  const handleWarningCancel = () => {
    setWarningDialog({ open: false, file: null, pendingFiles: [] });
  };

  const handleDownload = (filePath: string, fileName: string) => {
    downloadFile(filePath, fileName);
  };

  const handleDelete = (fileId: string, filePath: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteFile(fileId, filePath);
    }
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileIcon className="w-5 h-5" />;

    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-green-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
      return <Archive className="w-5 h-5 text-yellow-500" />;
    }
    if (
      mimeType.includes('document') ||
      mimeType.includes('word') ||
      mimeType.includes('text')
    ) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    return <FileIcon className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>File Shelf</CardTitle>
          <CardDescription>
            {readOnly ? 'View and download project files' : 'Upload and manage project files'}
          </CardDescription>
        </CardHeader>
        {!readOnly && (
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading || isCompressing}
              multiple
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isCompressing}
            >
              {isCompressing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Compressing...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File(s)
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      <div className="space-y-3">
        {/* Show uploading files with progress */}
        {Array.from(uploadingFiles.values()).map((uploadingFile, index) => (
          <Card key={`uploading-${index}`} className="border-primary/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadingFile.name}</p>
                  <div className="mt-2 space-y-1">
                    <Progress value={uploadingFile.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{uploadingFile.status}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {files.length === 0 && uploadingFiles.size === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No files uploaded yet. Upload your first file!</p>
            </CardContent>
          </Card>
        ) : (
          files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">{getFileIcon(file.mime_type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>•</span>
                      <span>Uploaded by {file.uploaded_by_user.name}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file.file_path, file.file_name)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {!readOnly && user?.id === file.uploaded_by && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(file.id, file.file_path)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Warning Dialog for Large Files */}
      {warningDialog.file && (() => {
        const category = getFileCategory(warningDialog.file!);
        const fileType = category === 'video' ? 'video' : category === 'large' ? 'large' : 'other';
        return (
          <CompressionWarningDialog
            open={warningDialog.open}
            onOpenChange={(open) => setWarningDialog({ 
              open, 
              file: open ? warningDialog.file : null,
              pendingFiles: open ? warningDialog.pendingFiles : []
            })}
            fileName={warningDialog.file.name}
            fileSize={warningDialog.file.size}
            fileType={fileType}
            onProceed={handleWarningProceed}
            onCancel={handleWarningCancel}
          />
        );
      })()}
    </div>
  );
};



