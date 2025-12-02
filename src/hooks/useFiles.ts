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
    }: {
      file: File;
      userId: string;
    }) => {
      if (!projectId) throw new Error('No project ID');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { data, error: dbError } = await supabase
        .from('files')
        .insert([
          {
            project_id: projectId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: userId,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      return data;
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
  const uploadFile = async (file: File, userId: string) => {
    return uploadFileMutation.mutateAsync({ file, userId });
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
  };
};
