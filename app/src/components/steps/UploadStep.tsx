'use client'

import { useState } from 'react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, CheckCircleIcon, LoaderIcon, UploadIcon, RefreshCwIcon } from 'lucide-react';
import JSZip from 'jszip';
import { getAudioDuration } from '@/utils/audio';
import type MP3File from "@/interface/MP3File.tsx";

type UploadStatus = 'idle' | 'extracting' | 'ready' | 'error';

interface UploadStepProps {
  onFilesExtracted: (files: MP3File[], originalZipName: string) => void;
  onError: (error: string) => void;
}

export const UploadStep = ({ onFilesExtracted, onError }: UploadStepProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [fileCount, setFileCount] = useState(0);

  const handleDrop = async (droppedFiles: File[]) => {
    if (droppedFiles.length === 0) return;
    
    const zipFile = droppedFiles[0];
    setFiles([zipFile]);
    setStatus('extracting');
    setError('');
    setProgress(0);
    setFileCount(0);

    try {
      const zipData = await JSZip.loadAsync(zipFile);
      let mp3Entries = Object.keys(zipData.files).filter(
        fileName => fileName.toLowerCase().endsWith('.mp3') && !zipData.files[fileName].dir
      );

      // If no MP3 files found, check for nested ZIP files
      if (mp3Entries.length === 0) {
        const nestedZipEntries = Object.keys(zipData.files).filter(
          fileName => fileName.toLowerCase().endsWith('.zip') && !zipData.files[fileName].dir
        );

        if (nestedZipEntries.length > 0) {
          console.log(`Found ${nestedZipEntries.length} nested ZIP files, extracting...`);

          // Extract the first nested ZIP and look for MP3s
          const nestedZipFile = zipData.files[nestedZipEntries[0]];
          const nestedZipBlob = await nestedZipFile.async('blob');
          const nestedZipData = await JSZip.loadAsync(nestedZipBlob);

          mp3Entries = Object.keys(nestedZipData.files).filter(
            fileName => fileName.toLowerCase().endsWith('.mp3') && !nestedZipData.files[fileName].dir
          );

          if (mp3Entries.length > 0) {
            // Use the nested ZIP data for extraction
            zipData.files = nestedZipData.files;
            console.log(`Found ${mp3Entries.length} MP3 files in nested ZIP`);
          }
        }
      }

      if (mp3Entries.length === 0) {
        setError('No MP3 files found in the ZIP archive or nested ZIP files');
        setStatus('error');
        onError('No MP3 files found in the ZIP archive or nested ZIP files');
        return;
      }

      setFileCount(mp3Entries.length);
      const extractedFiles: MP3File[] = [];
      
      // Process files in chunks to prevent blocking the main thread
      for (let i = 0; i < mp3Entries.length; i++) {
        const fileName = mp3Entries[i];
        const fileProgress = (i / mp3Entries.length) * 100;
        setProgress(fileProgress);
        
        // Yield control to prevent blocking with requestIdleCallback fallback
        await new Promise(resolve => {
          if (window.requestIdleCallback) {
            window.requestIdleCallback(resolve);
          } else {
            setTimeout(resolve, 0);
          }
        });
        
        try {
          const fileData = zipData.files[fileName];
          const blob = await fileData.async('blob');
          const duration = await getAudioDuration(blob);
          
          extractedFiles.push({
            name: fileName.split('/').pop() || fileName,
            size: blob.size,
            duration,
            blob
          });
        } catch (err) {
          console.warn(`Failed to process ${fileName}:`, err);
        }
      }

      if (extractedFiles.length === 0) {
        setError('Failed to extract any valid MP3 files');
        setStatus('error');
        onError('Failed to extract any valid MP3 files');
        return;
      }

      setProgress(100);
      setStatus('ready');
      onFilesExtracted(extractedFiles, zipFile.name);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process ZIP file';
      setError(errorMessage);
      setStatus('error');
      onError(errorMessage);
    }
  };

  const reset = () => {
    setFiles([]);
    setStatus('idle');
    setError('');
    setProgress(0);
    setFileCount(0);
  };

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <Dropzone
          accept={{ 'application/zip': ['.zip'] }}
          maxFiles={1}
          maxSize={500 * 1024 * 1024} // 500MB
          onDrop={handleDrop}
          onError={(error) => {
            setStatus('error');
            setError(error.message);
            onError(error.message);
          }}
          src={files}
          disabled={status === 'extracting'}
          className={status === 'extracting' ? "opacity-50 cursor-not-allowed" : ""}
        >
          <DropzoneEmptyState>
            <div className="space-y-4 py-8">
              <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-xl font-medium">Upload ZIP file with MP3 chapters</p>
                <p className="text-muted-foreground">
                  Drop your ZIP file here or click to browse (max 500MB)
                </p>
              </div>
            </div>
          </DropzoneEmptyState>
          <DropzoneContent />
        </Dropzone>

        {status === 'extracting' && (
          <div className="space-y-4 mt-6 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center space-x-3 text-blue-600">
              <LoaderIcon className="h-5 w-5 animate-spin" />
              <div>
                <p className="font-medium">Extracting MP3 files...</p>
                <p className="text-sm text-muted-foreground">
                  {fileCount > 0 ? `Found ${fileCount} MP3 files` : 'Scanning archive...'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
        
        {status === 'ready' && (
          <div className="mt-6 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center space-x-3 text-green-600">
              <CheckCircleIcon className="h-5 w-5" />
              <div>
                <p className="font-medium">Successfully extracted {fileCount} MP3 files</p>
                <p className="text-sm text-muted-foreground">Ready to configure white noise settings</p>
              </div>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="mt-6 p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-red-600">
                <AlertCircleIcon className="h-5 w-5" />
                <div>
                  <p className="font-medium">Upload Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
              <Button onClick={reset} variant="outline" size="sm">
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
