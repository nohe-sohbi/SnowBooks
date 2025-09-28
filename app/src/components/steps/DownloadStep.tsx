'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon, LoaderIcon, PackageIcon, CheckCircleIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { audioProcessingAPI } from '@/services/audioProcessingAPI';
import { formatSize } from '@/utils/formatters';

interface DownloadStepProps {
  jobId: string;
  originalZipName?: string;
  onStartOver: () => void;
}

interface FileInfo {
  fileName: string;
  fileSize: number;
  fileCount?: number;
}

type ExportStatus = 'idle' | 'creating' | 'downloading' | 'completed' | 'error';

export const DownloadStep = ({ jobId, originalZipName, onStartOver }: DownloadStepProps) => {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [error, setError] = useState<string>('');
  const [downloadedFileName, setDownloadedFileName] = useState<string>('');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  // Load file info on component mount
  useEffect(() => {
    const loadFileInfo = async () => {
      try {
        const info = await audioProcessingAPI.getDownloadInfo(jobId);
        setFileInfo(info);
      } catch (error) {
        console.error('Failed to load file info:', error);
        // Don't set error state here, just log it
      }
    };

    if (jobId) {
      loadFileInfo();
    }
  }, [jobId]);

  const downloadProcessedFiles = async () => {
    try {
      setStatus('downloading');
      setError('');
      setDownloadProgress(0);

      // Get file info if not already loaded
      let info = fileInfo;
      if (!info) {
        info = await audioProcessingAPI.getDownloadInfo(jobId);
        setFileInfo(info);
      }

      // Simulate download progress for better UX
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Download the processed ZIP file
      const blob = await audioProcessingAPI.downloadResult(jobId);

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = info.fileName || `${originalZipName?.replace(/\.zip$/i, '') || 'processed-audio'}-with-white-noise.zip`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadedFileName(fileName);
      setStatus('completed');

    } catch (error) {
      console.error('Download failed:', error);
      setError(error instanceof Error ? error.message : 'Download failed');
      setStatus('error');
      setDownloadProgress(0);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'downloading':
        return <LoaderIcon className="h-6 w-6 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <PackageIcon className="h-6 w-6 text-primary" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'downloading':
        return `Downloading processed files... ${downloadProgress}%`;
      case 'completed':
        return `Successfully downloaded: ${downloadedFileName}`;
      case 'error':
        return `Error: ${error}`;
      default:
        return 'Ready to download your processed files';
    }
  };

  const isProcessing = status === 'downloading';

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        {/* Success Summary */}
        <div className="p-6 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
                Processing Complete!
              </h3>
              <p className="text-green-700 dark:text-green-300">
                Your MP3 files have been successfully processed with white noise.
              </p>
            </div>
          </div>
        </div>

        {/* Download Card */}
        <div className="p-6 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <h3 className="text-xl font-semibold">Download Processed Files</h3>
                <p className="text-muted-foreground">
                  {fileInfo ? `${formatSize(fileInfo.fileSize)} • ${fileInfo.fileName}` : 'Processed audio files ready'}
                </p>
              </div>
            </div>
            
            {status !== 'completed' && (
              <Button
                onClick={downloadProcessedFiles}
                disabled={isProcessing}
                size="lg"
                className="min-w-[140px]"
              >
                {isProcessing ? (
                  <>
                    <LoaderIcon className="h-5 w-5 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="h-5 w-5 mr-2" />
                    Download ZIP
                  </>
                )}
              </Button>
            )}

            {status === 'error' && (
              <Button
                onClick={() => setStatus('idle')}
                variant="outline"
                size="lg"
              >
                <RefreshCwIcon className="h-5 w-5 mr-2" />
                Try Again
              </Button>
            )}
          </div>

          {/* Status */}
          <div className="mb-4">
            <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
              {getStatusText()}
            </p>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Download Progress</span>
                <span className="font-mono">{downloadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Preparing your processed files for download...
              </p>
            </div>
          )}

          {/* Completed State */}
          {status === 'completed' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
                <DownloadIcon className="h-5 w-5" />
                <div>
                  <p className="font-medium">Download Complete!</p>
                  <p className="text-sm">Your processed files have been saved to your downloads folder.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Info */}
        {fileInfo && (
          <div className="p-4 border rounded-lg bg-muted/10">
            <h4 className="font-medium mb-3">Download Details</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>File name:</span>
                <span className="font-mono text-right break-all">{fileInfo.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span>File size:</span>
                <span className="font-mono">{formatSize(fileInfo.fileSize)}</span>
              </div>
              {fileInfo.fileCount && (
                <div className="flex justify-between">
                  <span>Files processed:</span>
                  <span className="font-mono">{fileInfo.fileCount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Format:</span>
                <span>MP3 with white noise</span>
              </div>
              <div className="flex justify-between">
                <span>Compression:</span>
                <span>ZIP archive</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center pt-6">
          <Button onClick={onStartOver} variant="outline" size="lg">
            <RefreshCwIcon className="h-5 w-5 mr-2" />
            Process Another ZIP File
          </Button>
        </div>
      </div>
    </div>
  );
};
