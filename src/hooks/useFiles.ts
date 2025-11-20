import { useState, useEffect } from 'react';
import { supabase, type File as FileType } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface FileWithUser extends FileType {
  uploaded_by_user: {
    id: string;
    name: string;
  };
}

export const useFiles = (projectId: string | undefined) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchFiles = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          uploaded_by_user:users!files_uploaded_by_fkey(id, name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data as FileWithUser[]);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load files.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();

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
          fetchFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const uploadFile = async (file: File, userId: string) => {
    if (!projectId) return;

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      // Save file metadata to database
      const { error: dbError } = await supabase.from('files').insert([
        {
          project_id: projectId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: userId,
        },
      ]);

      if (dbError) throw dbError;

      await fetchFiles();

      toast({
        title: 'Success',
        description: 'File uploaded successfully!',
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload file.',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

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

  const deleteFile = async (fileId: string, filePath: string) => {
    try {
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

      await fetchFiles();

      toast({
        title: 'Success',
        description: 'File deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete file.',
      });
      throw error;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return {
    files,
    isLoading,
    isUploading,
    uploadFile,
    downloadFile,
    deleteFile,
    refreshFiles: fetchFiles,
    formatFileSize,
  };
};



