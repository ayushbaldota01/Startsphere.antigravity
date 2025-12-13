import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type File as FileType } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryClient';
import { useEffect, useState } from 'react';

export interface FileWithUser extends FileType {
  uploaded_by_user: {
    id: string;
    name: string;
  };
}

// Fetch files using RPC function
const fetchProjectFiles = async (
  projectId: string,
  userId: string
): Promise<FileWithUser[]> => {
  const { data, error } = await supabase.rpc('get_project_files', {
    project_uuid: projectId,
    user_uuid: userId,
  });

  if (error) {
    console.error('Error fetching files:', error);
    throw error;
  }

  return data || [];
};

// Fallback fetch without RPC
const fetchProjectFilesFallback = async (
  projectId: string
): Promise<FileWithUser[]> => {
  const { data, error } = await supabase
    .from('files')
    .select(`
      *,
      uploaded_by_user:users!files_uploaded_by_fkey(id, name)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as FileWithUser[];
};

export const useFiles = (projectId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>({});

  // Main files query
  const {
    data: files = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.files.byProject(projectId || ''),
    queryFn: async () => {
      if (!projectId || !user?.id) return [];

      try {
        return await fetchProjectFiles(projectId, user.id);
      } catch (rpcError) {
        console.warn('RPC not available, using fallback query');
        return await fetchProjectFilesFallback(projectId);
      }
    },
    enabled: !!projectId && !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`files-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.files.byProject(projectId),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({
      file,
      userId,
      originalFileName,
      onProgress,
    }: {
      file: File;
      userId: string;
      originalFileName?: string;
      onProgress?: (progress: number) => void;
    }) => {
      if (!projectId) throw new Error('No project ID');

      // Preserve original file name and metadata
      const originalName = originalFileName || file.name;
      const originalMimeType = file.type;

      // File is already optimized by FileShelf component before calling uploadFile
      // No need to compress again here
      const optimizedFile = file;
      const optimizedSize = file.size;

      // Upload optimized file to storage
      const fileExt = optimizedFile.name.split('.').pop() || originalName.split('.').pop() || 'file';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      // Create a unique key for this upload
      const uploadKey = `${filePath}-${Date.now()}`;
      
      // Set initial status
      setUploadStatus(prev => ({ ...prev, [uploadKey]: 'Uploading...' }));
      setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }));

      // For large files, use upsert with cacheControl and better error handling
      const fileSizeMB = optimizedFile.size / (1024 * 1024);
      const isLargeFile = fileSizeMB > 20;

      try {
        // Use upload with progress tracking
        const uploadOptions: any = {
          cacheControl: '3600',
          upsert: false,
        };

        // Use Supabase client with progress simulation for better reliability
        // Simulate progress during upload
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[uploadKey] || 0;
            if (current < 90) {
              const newProgress = Math.min(current + 5, 90);
              if (onProgress) onProgress(newProgress);
              return { ...prev, [uploadKey]: newProgress };
            }
            return prev;
          });
        }, 200);

        try {
          // Upload using Supabase client (more reliable)
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('project-files')
            .upload(filePath, optimizedFile, {
              cacheControl: '3600',
              upsert: false,
            });

          clearInterval(progressInterval);

          if (uploadError) {
            // Check if file already exists
            if (uploadError.message?.includes('already exists') || uploadError.message?.includes('duplicate')) {
              // Try with upsert
              setUploadStatus(prev => ({ ...prev, [uploadKey]: 'File exists, updating...' }));
              const { error: upsertError } = await supabase.storage
                .from('project-files')
                .update(filePath, optimizedFile, {
                  cacheControl: '3600',
                  upsert: true,
                });

              if (upsertError) {
                throw new Error(upsertError.message || 'Failed to upload file');
              }
            } else {
              throw new Error(uploadError.message || 'Failed to upload file');
            }
          }

          // Set to 95% after upload, 100% after metadata save
          setUploadProgress(prev => ({ ...prev, [uploadKey]: 95 }));
          if (onProgress) onProgress(95);
          setUploadStatus(prev => ({ ...prev, [uploadKey]: 'Upload complete, saving metadata...' }));
        } catch (uploadErr: any) {
          clearInterval(progressInterval);
          setUploadStatus(prev => ({ ...prev, [uploadKey]: 'Upload failed' }));
          throw uploadErr;
        }

        setUploadProgress(prev => ({ ...prev, [uploadKey]: 100 }));
        setUploadStatus(prev => ({ ...prev, [uploadKey]: 'Saving metadata...' }));
      } catch (uploadError: any) {
        setUploadStatus(prev => ({ ...prev, [uploadKey]: 'Upload failed' }));
        // Clean up progress on upload error
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[uploadKey];
            return newProgress;
          });
          setUploadStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[uploadKey];
            return newStatus;
          });
        }, 2000);
        throw uploadError;
      }

      // Save file metadata to database (preserve original name and type)
      setUploadStatus(prev => ({ ...prev, [uploadKey]: 'Saving metadata...' }));
      
      // Add timeout for metadata save to prevent hanging
      const metadataSavePromise = supabase
        .from('files')
        .insert([
          {
            project_id: projectId,
            file_name: originalName, // Preserve original file name
            file_path: filePath,
            file_size: optimizedSize, // Store optimized size
            mime_type: originalMimeType, // Preserve original MIME type
            uploaded_by: userId,
          },
        ])
        .select()
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Metadata save timeout')), 10000); // 10 second timeout
      });

      try {
        const { data, error: dbError } = await Promise.race([
          metadataSavePromise,
          timeoutPromise,
        ]) as any;

        if (dbError) {
          console.error('[FileUpload] Database error:', dbError);
          setUploadStatus(prev => ({ ...prev, [uploadKey]: 'Metadata save failed' }));
          // Clean up after showing error
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[uploadKey];
              return newProgress;
            });
            setUploadStatus(prev => {
              const newStatus = { ...prev };
              delete newStatus[uploadKey];
              return newStatus;
            });
          }, 2000);
          throw new Error(dbError.message || 'Failed to save file metadata');
        }

        // Success - update to 100% and clean up
        setUploadProgress(prev => ({ ...prev, [uploadKey]: 100 }));
        if (onProgress) onProgress(100);
        setUploadStatus(prev => ({ ...prev, [uploadKey]: 'Complete!' }));
        
        // Clean up progress tracking after brief delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[uploadKey];
            return newProgress;
          });
          setUploadStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[uploadKey];
            return newStatus;
          });
        }, 500);

        return data;
      } catch (dbError: any) {
        // Clean up progress even if metadata save fails
        console.error('[FileUpload] Metadata save error:', dbError);
        setUploadStatus(prev => ({ ...prev, [uploadKey]: dbError.message?.includes('timeout') ? 'Metadata save timeout' : 'Metadata save failed' }));
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[uploadKey];
            return newProgress;
          });
          setUploadStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[uploadKey];
            return newStatus;
          });
        }, 2000);
        throw dbError;
      }
    },
    onMutate: () => {
      setIsUploading(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.files.byProject(projectId || ''),
      });
      toast({
        title: 'Success',
        description: 'File uploaded successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload file.',
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Delete file mutation with optimistic update
  const deleteFileMutation = useMutation({
    mutationFn: async ({
      fileId,
      filePath,
    }: {
      fileId: string;
      filePath: string;
    }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
    },
    onMutate: async ({ fileId }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.files.byProject(projectId || ''),
      });

      const previousFiles = queryClient.getQueryData<FileWithUser[]>(
        queryKeys.files.byProject(projectId || '')
      );

      // Optimistically remove the file
      queryClient.setQueryData<FileWithUser[]>(
        queryKeys.files.byProject(projectId || ''),
        (old) => old?.filter((file) => file.id !== fileId)
      );

      return { previousFiles };
    },
    onError: (err, _, context) => {
      if (context?.previousFiles) {
        queryClient.setQueryData(
          queryKeys.files.byProject(projectId || ''),
          context.previousFiles
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete file.',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'File deleted successfully!',
      });
    },
  });

  // Download file function
  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(filePath);

      if (error) throw error;

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'File downloaded successfully!',
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download file.',
      });
      throw error;
    }
  };

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Legacy API compatibility
  const uploadFile = async (file: File, userId: string, originalFileName?: string, onProgress?: (progress: number) => void) => {
    return uploadFileMutation.mutateAsync({ file, userId, originalFileName, onProgress });
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    return deleteFileMutation.mutateAsync({ fileId, filePath });
  };

  return {
    files,
    isLoading,
    isUploading,
    uploadFile,
    downloadFile,
    deleteFile,
    refreshFiles: refetch,
    formatFileSize,
    uploadFileMutation,
    deleteFileMutation,
    uploadProgress,
    uploadStatus,
  };
};
