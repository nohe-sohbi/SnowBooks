'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AudioCard, ProcessingCard } from '@/components/ui/card';
import { SuccessAlert, ErrorAlert } from '@/components/ui/alert';
import { AudioProcessingLoader } from '@/components/ui/loading';
import { AudioIcon, SnowflakeIcon, SuccessIcon, ErrorIcon } from '@/components/ui/icon';
import { Download, Package, CheckCircle2, RefreshCw, Gift, Sparkles, Trophy, Music, FileArchive, Zap, Star } from 'lucide-react';
import { audioProcessingAPI } from '@/services/audioProcessingAPI';
import { formatSize } from '@/utils/formatters';
import { cn } from '@/lib/utils';

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
        return <AudioProcessingLoader size="lg" />;
      case 'completed':
        return <SuccessIcon size="xl" />;
      case 'error':
        return <ErrorIcon size="xl" />;
      default:
        return <Gift className="h-8 w-8 text-warm-amber-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'downloading':
        return 'text-winter-blue-600 dark:text-winter-blue-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-warm-amber-600 dark:text-warm-amber-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'downloading':
        return `Preparing your winter audio collection... ${downloadProgress}%`;
      case 'completed':
        return `Successfully downloaded: ${downloadedFileName}`;
      case 'error':
        return `Download encountered an issue: ${error}`;
      default:
        return 'Your winter-enhanced audio collection is ready for download';
    }
  };

  const getDownloadStage = () => {
    if (status !== 'downloading') return null;

    if (downloadProgress < 30) return 'Gathering winter-enhanced files...';
    if (downloadProgress < 70) return 'Compressing audio collection...';
    if (downloadProgress < 95) return 'Finalizing download package...';
    return 'Completing download...';
  };

  const isProcessing = status === 'downloading';

  return (
    <div className="space-y-8">
      <div className="max-w-5xl mx-auto">

        {/* Winter-Themed Download Interface */}
        <ProcessingCard className="mb-8">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  {getStatusIcon()}
                  {status === 'downloading' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-warm-amber-500 rounded-full animate-pulse" />
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className={cn("text-2xl font-semibold", getStatusColor())}>
                    {status === 'idle' && 'Ready to Download'}
                    {status === 'downloading' && 'Preparing Download'}
                    {status === 'completed' && 'Download Complete'}
                    {status === 'error' && 'Download Error'}
                  </h4>
                  <p className="text-ice-gray-600 dark:text-ice-gray-400">
                    {fileInfo
                      ? `${formatSize(fileInfo.fileSize)} • ${fileInfo.fileCount || 'Multiple'} files • Winter enhanced`
                      : 'Your winter-enhanced audio collection awaits'
                    }
                  </p>
                  {getDownloadStage() && (
                    <p className="text-sm text-winter-blue-600 dark:text-winter-blue-400 font-medium">
                      {getDownloadStage()}
                    </p>
                  )}
                </div>
              </div>

              {/* Download Actions */}
              <div className="flex gap-4">
                {status !== 'completed' && status !== 'downloading' && (
                  <Button
                    onClick={downloadProcessedFiles}
                    disabled={isProcessing}
                    size="lg"
                    className="bg-gradient-to-r from-warm-amber-500 to-warm-amber-600 hover:from-warm-amber-600 hover:to-warm-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[180px]"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Winter Collection
                  </Button>
                )}

                {status === 'downloading' && (
                  <Button
                    disabled
                    size="lg"
                    className="bg-gradient-to-r from-winter-blue-500 to-winter-blue-600 text-white min-w-[180px]"
                  >
                    <AudioProcessingLoader size="sm" className="mr-2" />
                    Preparing Download...
                  </Button>
                )}

                {status === 'error' && (
                  <Button
                    onClick={() => setStatus('idle')}
                    variant="outline"
                    size="lg"
                    className="border-winter-blue-300 dark:border-winter-blue-600 text-winter-blue-600 dark:text-winter-blue-400 hover:bg-winter-blue-50 dark:hover:bg-winter-blue-950 min-w-[140px]"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>
            </div>

            {/* Status Description */}
            <div className="text-center mb-6">
              <p className={cn(
                "text-lg leading-relaxed",
                status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-ice-gray-600 dark:text-ice-gray-400'
              )}>
                {getStatusText()}
              </p>
            </div>

            {/* Winter-Themed Download Progress */}
            {isProcessing && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-winter-blue-800 dark:text-winter-blue-200">
                    Download Progress
                  </h5>
                  <span className="text-2xl font-bold text-winter-blue-600 dark:text-winter-blue-400 tabular-nums">
                    {downloadProgress}%
                  </span>
                </div>


                <Progress
                  value={downloadProgress}
                  variant="audio"
                  className="h-3"
                />

                {/* Download Stage Indicator */}
                <div className="p-4 bg-gradient-to-r from-ice-gray-50 to-ice-gray-100 dark:from-ice-gray-900 dark:to-ice-gray-800 rounded-xl border border-ice-gray-200 dark:border-ice-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-winter-blue-500 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-warm-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                      <div className="w-2 h-2 bg-winter-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>
                    <span className="text-sm font-medium text-ice-gray-700 dark:text-ice-gray-300">
                      {getDownloadStage()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {status === 'completed' && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <SuccessAlert
                  title="Download Complete!"
                  className="border-l-4 border-l-green-500"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="font-medium">Your winter-enhanced audio collection has been saved</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-green-700 dark:text-green-300">
                      <div className="flex items-center gap-1">
                        <FileArchive className="h-4 w-4" />
                        <span>ZIP archive downloaded</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <SnowflakeIcon size="xs" />
                        <span>Winter atmosphere applied</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>High quality preserved</span>
                      </div>
                    </div>

                    <p className="text-green-600 dark:text-green-400 text-sm leading-relaxed">
                      Your files have been saved to your downloads folder. Enjoy your winter-enhanced audio experience!
                    </p>
                  </div>
                </SuccessAlert>
              </div>
            )}
          </div>
        </ProcessingCard>

        {/* Error State */}
        {status === 'error' && (
          <div className="mb-8 animate-in slide-in-from-bottom-4 duration-300">
            <ErrorAlert
              title="Download Error"
              retry={() => setStatus('idle')}
              className="border-l-4 border-l-red-500"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <ErrorIcon size="sm" className="mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-red-700 dark:text-red-300 leading-relaxed">
                      {error}
                    </p>

                    {/* Download Error Guidance */}
                    <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                      <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        Download Troubleshooting:
                      </h5>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        <li>• Check your internet connection and try again</li>
                        <li>• Ensure you have sufficient storage space for the download</li>
                        <li>• Verify that your browser allows file downloads</li>
                        <li>• Try refreshing the page if the issue persists</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </ErrorAlert>
          </div>
        )}


      </div>
    </div>
  );
};
