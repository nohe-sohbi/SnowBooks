'use client'

import { useState } from 'react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, CheckCircleIcon, LoaderIcon, UploadIcon, RefreshCwIcon } from 'lucide-react';
import { audioProcessingAPI, type UploadResponse } from '@/services/audioProcessingAPI';
import type MP3File from "@/interface/MP3File.tsx";

type UploadStatus = 'idle' | 'extracting' | 'ready' | 'error';

interface UploadStepProps {
  onFilesExtracted: (files: MP3File[], originalZipName: string, jobId: string) => void;
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
      // Upload to backend API
      setProgress(10);
      const uploadResponse: UploadResponse = await audioProcessingAPI.uploadZip(zipFile);

      setProgress(50);
      setFileCount(uploadResponse.fileCount);

      // Get job details to extract MP3 file info
      const jobData = await audioProcessingAPI.getJobStatus(uploadResponse.jobId);

      setProgress(80);

      // Check if files were found
      if (jobData.mp3Files.length === 0) {
        setError('No MP3 files found in the ZIP archive');
        setStatus('error');
        onError('No MP3 files found in the ZIP archive');
        return;
      }

      // Convert backend MP3FileInfo to frontend MP3File format
      const mp3Files: MP3File[] = jobData.mp3Files.map(fileInfo => ({
        name: fileInfo.name,
        size: fileInfo.size,
        duration: fileInfo.duration,
        blob: new Blob(), // Placeholder - files are now on backend
      }));

      setProgress(100);
      setStatus('ready');
      onFilesExtracted(mp3Files, uploadResponse.originalZipName, uploadResponse.jobId);
      
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
