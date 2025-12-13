import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface CompressionWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileSize: number;
  fileType: 'video' | 'large' | 'other';
  onProceed: () => void;
  onCancel: () => void;
}

export const CompressionWarningDialog = ({
  open,
  onOpenChange,
  fileName,
  fileSize,
  fileType,
  onProceed,
  onCancel,
}: CompressionWarningDialogProps) => {
  const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

  const getMessage = () => {
    if (fileType === 'video') {
      return `The file "${fileName}" is a video file (${fileSizeMB} MB). For better performance and storage efficiency, consider uploading videos to YouTube or Google Drive and sharing the link instead.`;
    }
    if (fileType === 'large') {
      return `The file "${fileName}" is a large design file (${fileSizeMB} MB). These files are often better suited for external storage services like Google Drive or Dropbox.`;
    }
    return `The file "${fileName}" is large (${fileSizeMB} MB). Consider using external storage for better performance.`;
  };

  const getExternalLinks = () => {
    if (fileType === 'video') {
      return [
        { name: 'YouTube', url: 'https://www.youtube.com/upload' },
        { name: 'Google Drive', url: 'https://drive.google.com' },
      ];
    }
    return [
      { name: 'Google Drive', url: 'https://drive.google.com' },
      { name: 'Dropbox', url: 'https://www.dropbox.com' },
    ];
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle>Large File Detected</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {getMessage()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="text-sm font-medium mb-2">Recommended alternatives:</p>
          <div className="flex flex-wrap gap-2">
            {getExternalLinks().map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {link.name}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onProceed}>
            Proceed with Upload
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

