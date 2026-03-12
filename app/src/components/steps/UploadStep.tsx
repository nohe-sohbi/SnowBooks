'use client'

import { useState } from 'react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Button } from '@/components/ui/button';
import { AudioCard, ProcessingCard } from '@/components/ui/card';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loading } from '@/components/ui/loading';
import { AudioIcon, SnowflakeIcon, SuccessIcon, ErrorIcon } from '@/components/ui/icon';
import { Upload, RefreshCw, CheckCircle2 } from 'lucide-react';
import { audioProcessingAPI, type UploadResponse } from '@/services/audioProcessingAPI';
import { cn } from '@/lib/utils';
import type MP3File from "@/interface/MP3File";

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
      // Upload to backend API with real progress tracking
      setProgress(0);
      const uploadResponse: UploadResponse = await audioProcessingAPI.uploadZip(zipFile, (percent) => {
        // Map upload progress to 0-50% of overall progress
        setProgress(Math.round(percent * 0.5));
      });

      setProgress(50);
      setFileCount(uploadResponse.fileCount);

      // Get job details to extract MP3 file info
      const jobData = await audioProcessingAPI.getJobStatus(uploadResponse.jobId);

      setProgress(80);

      // Check if files were found
      if (jobData.mp3Files.length === 0) {
        setError('No MP3 files found in the archive');
        setStatus('error');
        onError('No MP3 files found in the archive');
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to process archive file';
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
    <div className="space-y-8">
      <div className="max-w-3xl mx-auto">
        {/* Winter Audio Studio Upload Area */}
        <AudioCard className="relative overflow-hidden">

          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-display font-bold bg-gradient-to-r from-winter-blue-900 to-winter-blue-600 bg-clip-text text-transparent mb-2">
                Upload Your Audio Collection
              </h3>
              <p className="text-ice-gray-600 dark:text-ice-gray-400 leading-relaxed">
                Drop your ZIP or RAR file containing MP3 chapters to begin the winter audio processing experience
              </p>
            </div>

            <Dropzone
              accept={{
                'application/zip': ['.zip'],
                'application/x-zip-compressed': ['.zip'],
                'application/x-rar-compressed': ['.rar'],
                'application/vnd.rar': ['.rar'],
                'application/octet-stream': ['.zip', '.rar'],
              }}
              maxFiles={1}
              maxSize={1024 * 1024 * 1024} // 1GB
              onDrop={handleDrop}
              onError={(error) => {
                setStatus('error');
                setError(error.message);
                onError(error.message);
              }}
              src={files}
              disabled={status === 'extracting'}
              className={cn(
                "border-2 border-dashed rounded-xl transition-all duration-300",
                status === 'extracting'
                  ? "border-winter-blue-300 bg-winter-blue-50 dark:bg-winter-blue-950 opacity-75 cursor-not-allowed"
                  : "border-ice-gray-300 hover:border-winter-blue-400 hover:bg-winter-blue-50 dark:border-ice-gray-600 dark:hover:border-winter-blue-500 dark:hover:bg-winter-blue-950/50",
                "focus-within:border-winter-blue-500 focus-within:ring-2 focus-within:ring-winter-blue-500 focus-within:ring-offset-2"
              )}
            >
              <DropzoneEmptyState>
                <div className="space-y-6 py-12 px-6">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="p-4 rounded-full bg-gradient-to-br from-winter-blue-500 to-winter-blue-600 shadow-lg">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-center">
                    <p className="text-xl font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                      Drop your ZIP or RAR file here
                    </p>
                    <p className="text-ice-gray-600 dark:text-ice-gray-400 max-w-md mx-auto leading-relaxed">
                      Or click to browse and select your audio collection (max 1GB)
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 text-sm text-ice-gray-500 dark:text-ice-gray-500">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>MP3 files supported</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>ZIP & RAR archives</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Up to 1GB</span>
                    </div>
                  </div>
                </div>
              </DropzoneEmptyState>
              <DropzoneContent />
            </Dropzone>
          </div>
        </AudioCard>

        {status === 'extracting' && (
          <ProcessingCard className="mt-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <Loading size="lg" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-lg font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                    Processing Your Audio Collection
                  </h4>
                  <p className="text-ice-gray-600 dark:text-ice-gray-400">
                    {fileCount > 0
                      ? `Discovered ${fileCount} MP3 files in your archive`
                      : 'Scanning and extracting audio files from your archive...'
                    }
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-medium text-winter-blue-700 dark:text-winter-blue-300">
                  <span>Extraction Progress</span>
                  <span className="tabular-nums">{Math.round(progress)}%</span>
                </div>

                <Progress
                  value={progress}
                  variant="audio"
                  className="h-3"
                />

              </div>
            </div>
          </ProcessingCard>
        )}
        
        {status === 'ready' && (
          <div className="mt-8 animate-in slide-in-from-bottom-4 duration-300">
            <SuccessAlert
              title="Audio Collection Ready!"
              className="border-l-4 border-l-green-500"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <SuccessIcon size="sm" />
                  <span className="font-medium">Successfully extracted {fileCount} MP3 files</span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-green-700 dark:text-green-300">
                  <div className="flex items-center gap-1">
                    <AudioIcon size="xs" />
                    <span>{fileCount} audio files</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>All files validated</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <SnowflakeIcon size="xs" />
                    <span>Ready for winter processing</span>
                  </div>
                </div>

                <p className="text-green-600 dark:text-green-400 text-sm leading-relaxed">
                  Your audio collection is ready! You can now proceed to configure the white noise settings
                  and create the perfect ambient listening experience.
                </p>
              </div>
            </SuccessAlert>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8 animate-in slide-in-from-bottom-4 duration-300">
            <ErrorAlert
              title="Upload Failed"
              retry={reset}
              className="border-l-4 border-l-red-500"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <ErrorIcon size="sm" className="mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-red-700 dark:text-red-300 leading-relaxed">
                      {error}
                    </p>

                    {/* Audio-specific error guidance */}
                    {(error.toLowerCase().includes('mp3') || error.toLowerCase().includes('audio')) && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                        <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">
                          Audio File Tips:
                        </h5>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                          <li>• Ensure your archive contains only MP3 files</li>
                          <li>• Check that audio files are not corrupted</li>
                          <li>• Verify file names don't contain special characters</li>
                          <li>• Try with a smaller archive first</li>
                        </ul>
                      </div>
                    )}

                    {(error.toLowerCase().includes('network') || error.toLowerCase().includes('timed out')) && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                        <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">
                          Connection Tips:
                        </h5>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                          <li>• Check your internet connection is stable</li>
                          <li>• Switch from mobile data to Wi-Fi if possible</li>
                          <li>• Try moving closer to your router</li>
                          <li>• For large files, try a faster connection</li>
                        </ul>
                      </div>
                    )}

                    {error.toLowerCase().includes('size') && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                        <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">
                          File Size Tips:
                        </h5>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                          <li>• Maximum file size is 1GB</li>
                          <li>• Try compressing your audio files</li>
                          <li>• Split large collections into smaller archives</li>
                          <li>• Remove any non-audio files from the archive</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={reset} variant="outline" size="sm" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => window.open('https://support.example.com/audio-upload', '_blank')}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Get Help
                  </Button>
                </div>
              </div>
            </ErrorAlert>
          </div>
        )}
      </div>
    </div>
  );
};
