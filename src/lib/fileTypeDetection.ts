/**
 * File Type Detection Utility
 * Categorizes files for appropriate compression/optimization handling
 */

export type FileCategory = 'image' | 'document' | 'video' | 'large' | 'other';

export interface FileTypeInfo {
  category: FileCategory;
  mimeType: string;
  extension: string;
  shouldCompress: boolean;
  shouldWarn: boolean;
}

/**
 * Get file extension from filename
 */
const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Categorize file based on MIME type and extension
 */
export const getFileCategory = (file: File): FileCategory => {
  const mimeType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);

  // Image files
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  // Video files
  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  // Large/unsupported file types that should warn user
  const largeFileExtensions = ['psd', 'ai', 'sketch', 'fig', 'xd', 'indd'];
  const largeMimeTypes = ['application/vnd.adobe.photoshop', 'application/postscript'];
  
  if (largeFileExtensions.includes(extension) || largeMimeTypes.some(mt => mimeType.includes(mt))) {
    return 'large';
  }

  // Document files (PDF, DOCX, etc.)
  const documentMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf',
  ];

  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'];

  if (documentMimeTypes.some(mt => mimeType.includes(mt)) || documentExtensions.includes(extension)) {
    return 'document';
  }

  // Default to other
  return 'other';
};

/**
 * Get detailed file type information
 */
export const getFileTypeInfo = (file: File): FileTypeInfo => {
  const category = getFileCategory(file);
  const extension = getFileExtension(file.name);

  return {
    category,
    mimeType: file.type,
    extension,
    shouldCompress: category === 'image',
    shouldWarn: category === 'video' || category === 'large',
  };
};

/**
 * Check if file is an image that can be compressed
 */
export const isCompressibleImage = (file: File): boolean => {
  const category = getFileCategory(file);
  if (category !== 'image') return false;

  const mimeType = file.type.toLowerCase();
  return mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/png';
};

/**
 * Check if file should trigger a warning
 */
export const shouldWarnUser = (file: File): boolean => {
  const info = getFileTypeInfo(file);
  return info.shouldWarn;
};

/**
 * Get human-readable file type description
 */
export const getFileTypeDescription = (file: File): string => {
  const category = getFileCategory(file);
  const extension = getFileExtension(file.name).toUpperCase();

  switch (category) {
    case 'image':
      return `Image (${extension})`;
    case 'document':
      return `Document (${extension})`;
    case 'video':
      return `Video (${extension})`;
    case 'large':
      return `Large File (${extension})`;
    default:
      return `File (${extension})`;
  }
};

