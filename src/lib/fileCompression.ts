/**
 * File Compression Utility
 * Optimizes files before upload to reduce storage usage
 */

import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import { getFileCategory, isCompressibleImage, shouldWarnUser, type FileCategory } from './fileTypeDetection';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  onProgress?: (progress: number) => void;
  skipSmallFiles?: boolean; // Skip compression for files smaller than threshold
  smallFileThresholdMB?: number; // Threshold in MB (default: 3MB)
  maxCompressSizeMB?: number; // Skip compression for files larger than this (default: 20MB)
  compressionTimeout?: number; // Timeout in milliseconds (default: 30000 = 30s)
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

/**
 * Compress a single image file with timeout protection
 */
const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    useWebWorker = true,
    onProgress,
    compressionTimeout = 30000, // 30 seconds default
  } = options;

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Compression timeout: Operation took too long'));
      }, compressionTimeout);
    });

    // Race compression against timeout
    const compressionPromise = imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      onProgress: onProgress
        ? (progress) => {
            // Convert progress to 0-100 range
            onProgress(Math.round(progress * 100));
          }
        : undefined,
      fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
    });

    const compressedFile = await Promise.race([compressionPromise, timeoutPromise]);
    return compressedFile;
  } catch (error) {
    console.warn('[FileCompression] Image compression failed:', error);
    throw error;
  }
};

/**
 * Create a ZIP archive from multiple files
 */
const createZipArchive = async (files: File[]): Promise<File> => {
  try {
    const zip = new JSZip();

    // Add all files to the ZIP
    for (const file of files) {
      zip.file(file.name, file);
    }

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6, // Balanced compression
        },
      },
      (metadata) => {
        // Optional: track ZIP creation progress
        if (metadata.percent) {
          // Progress callback if needed
        }
      }
    );

    // Create a File object from the blob
    const zipFile = new File(
      [zipBlob],
      `archive_${Date.now()}.zip`,
      {
        type: 'application/zip',
        lastModified: Date.now(),
      }
    );

    return zipFile;
  } catch (error) {
    console.warn('[FileCompression] ZIP creation failed:', error);
    throw error;
  }
};

/**
 * Optimize a single file for upload
 */
export const optimizeFileForUpload = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const originalSize = file.size;
  let optimizedFile: File = file;
  let wasCompressed = false;

  const {
    skipSmallFiles = true,
    smallFileThresholdMB = 3,
    maxCompressSizeMB = 20,
  } = options;

  const fileSizeMB = originalSize / (1024 * 1024);

  // Skip compression for small files (< 3MB by default)
  if (skipSmallFiles && fileSizeMB < smallFileThresholdMB) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      wasCompressed: false,
    };
  }

  // Skip compression for very large files (> 20MB by default) to avoid timeouts
  if (fileSizeMB > maxCompressSizeMB) {
    console.log(`[FileCompression] Skipping compression for large file (${fileSizeMB.toFixed(2)}MB): ${file.name}`);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      wasCompressed: false,
    };
  }

  try {
    const category = getFileCategory(file);

    // Handle images
    if (category === 'image' && isCompressibleImage(file)) {
      try {
        optimizedFile = await compressImage(file, options);
        wasCompressed = optimizedFile.size < originalSize;
      } catch (error) {
        console.warn('[FileCompression] Image compression failed, using original:', error);
        optimizedFile = file;
      }
    }
    // Documents and other files pass through unchanged
    // (unless multiple files, which is handled separately)

    const compressedSize = optimizedFile.size;
    const compressionRatio = originalSize > 0 
      ? ((originalSize - compressedSize) / originalSize) * 100 
      : 0;

    return {
      file: optimizedFile,
      originalSize,
      compressedSize,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      wasCompressed,
    };
  } catch (error) {
    console.warn('[FileCompression] Optimization failed, using original file:', error);
    // Fallback to original file
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      wasCompressed: false,
    };
  }
};

/**
 * Optimize multiple files for upload
 * If multiple documents, creates a ZIP archive
 * Images are compressed individually
 */
export const optimizeFilesForUpload = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> => {
  if (files.length === 0) {
    return [];
  }

  // If only one file, use single file optimization
  if (files.length === 1) {
    return [await optimizeFileForUpload(files[0], options)];
  }

  // Multiple files: check if we should bundle documents
  const categories = files.map(getFileCategory);
  const hasImages = categories.some(cat => cat === 'image');
  const hasDocuments = categories.some(cat => cat === 'document');
  const hasOther = categories.some(cat => cat === 'other');

  // If we have multiple documents (and no images), bundle into ZIP
  if (hasDocuments && !hasImages && !hasOther) {
    try {
      const zipFile = await createZipArchive(files);
      const result = await optimizeFileForUpload(zipFile, options);
      return [result];
    } catch (error) {
      console.warn('[FileCompression] ZIP bundling failed, uploading files individually:', error);
      // Fallback: process files individually
      return Promise.all(files.map(file => optimizeFileForUpload(file, options)));
    }
  }

  // Otherwise, process each file individually
  return Promise.all(files.map(file => optimizeFileForUpload(file, options)));
};

/**
 * Check if file should trigger a warning before upload
 */
export const shouldShowWarning = (file: File): boolean => {
  return shouldWarnUser(file);
};

/**
 * Get warning message for large/unsupported files
 */
export const getWarningMessage = (file: File): string => {
  const category = getFileCategory(file);
  const fileName = file.name;
  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

  if (category === 'video') {
    return `The file "${fileName}" is a video file (${fileSizeMB} MB). For better performance and storage efficiency, consider uploading videos to YouTube or Google Drive and sharing the link instead. Do you want to proceed with the upload?`;
  }

  if (category === 'large') {
    return `The file "${fileName}" is a large design file (${fileSizeMB} MB). These files are often better suited for external storage services like Google Drive or Dropbox. Do you want to proceed with the upload?`;
  }

  return `The file "${fileName}" is large (${fileSizeMB} MB). Do you want to proceed with the upload?`;
};

