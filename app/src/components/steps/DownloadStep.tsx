'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AudioCard, ProcessingCard } from '@/components/ui/card';
import { SuccessAlert, ErrorAlert } from '@/components/ui/alert';
import { AudioProcessingLoader, SnowflakeLoader } from '@/components/ui/loading';
import { AudioIcon, SnowflakeIcon, SuccessIcon, ErrorIcon } from '@/components/ui/icon';
import { Download, Package, CheckCircle2, AlertTriangle, RefreshCw, Gift, Sparkles, Trophy, Music, FileArchive, Clock, Zap, Star } from 'lucide-react';
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
        {/* Winter Success Celebration */}
        <AudioCard className="relative overflow-hidden mb-8">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating Snowflakes */}
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              >
                <SnowflakeIcon
                  size="sm"
                  className="text-winter-blue-200 dark:text-winter-blue-800 opacity-30"
                />
              </div>
            ))}

            {/* Success Sparkles */}
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={`sparkle-${i}`}
                className="absolute animate-ping"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${2 + Math.random()}s`
                }}
              >
                <Sparkles className="h-4 w-4 text-warm-amber-400 opacity-60" />
              </div>
            ))}
          </div>

          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-warm-amber-500 to-winter-blue-500" />

          <div className="relative p-8">
            <div className="text-center mb-8">
              {/* Success Trophy */}
              <div className="inline-flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="p-6 rounded-full bg-gradient-to-br from-green-100 to-warm-amber-100 dark:from-green-900 dark:to-warm-amber-900 animate-pulse">
                    <Trophy className="h-12 w-12 text-warm-amber-600 dark:text-warm-amber-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 p-2 rounded-full bg-green-500 animate-bounce">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Star className="h-8 w-8 text-warm-amber-500 animate-pulse" style={{ animationDelay: '0s' }} />
                  <Star className="h-8 w-8 text-warm-amber-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <Star className="h-8 w-8 text-warm-amber-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>

              <h3 className="text-4xl font-display font-bold bg-gradient-to-r from-green-600 via-warm-amber-600 to-winter-blue-600 bg-clip-text text-transparent mb-4">
                🎉 Winter Processing Complete! 🎉
              </h3>
              <p className="text-xl text-ice-gray-600 dark:text-ice-gray-400 leading-relaxed max-w-3xl mx-auto mb-6">
                Congratulations! Your audio collection has been transformed with the perfect winter atmosphere.
                Your enhanced files are ready for download.
              </p>

              {/* Achievement Badges */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-full border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Processing Complete</span>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-warm-amber-50 to-warm-amber-100 dark:from-warm-amber-950 dark:to-warm-amber-900 rounded-full border border-warm-amber-200 dark:border-warm-amber-800">
                  <SnowflakeIcon size="xs" />
                  <span className="text-sm font-medium text-warm-amber-700 dark:text-warm-amber-300">Winter Enhanced</span>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-winter-blue-50 to-winter-blue-100 dark:from-winter-blue-950 dark:to-winter-blue-900 rounded-full border border-winter-blue-200 dark:border-winter-blue-800">
                  <Zap className="h-4 w-4 text-winter-blue-600 dark:text-winter-blue-400" />
                  <span className="text-sm font-medium text-winter-blue-700 dark:text-winter-blue-300">High Quality</span>
                </div>
              </div>
            </div>
          </div>
        </AudioCard>

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

                {/* Animated Download Waveform */}
                <div className="relative h-12 bg-gradient-to-r from-winter-blue-50 to-warm-amber-50 dark:from-winter-blue-950 dark:to-warm-amber-950 rounded-xl overflow-hidden border border-winter-blue-200 dark:border-winter-blue-800">
                  <div className="absolute inset-0 flex items-center justify-center gap-1 px-4">
                    {Array.from({ length: 30 }, (_, i) => {
                      const progressPoint = downloadProgress / 100;
                      const isActive = i / 30 <= progressPoint;
                      const height = Math.sin((i / 30) * Math.PI * 6 + Date.now() / 400) * 0.3 + 0.7;

                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 rounded-full transition-all duration-300",
                            isActive
                              ? "bg-gradient-to-t from-winter-blue-500 to-warm-amber-500"
                              : "bg-ice-gray-300 dark:bg-ice-gray-600"
                          )}
                          style={{
                            height: `${height * 30}px`,
                            opacity: isActive ? 0.9 : 0.3,
                            animationDelay: `${i * 50}ms`
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Progress Overlay */}
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-winter-blue-400/20 to-warm-amber-400/20 transition-all duration-500"
                    style={{ width: `${downloadProgress}%` }}
                  />
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
        </div>

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

        {/* Winter-Themed Download Details */}
        {fileInfo && (
          <ProcessingCard className="p-8 mb-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-6 w-6 text-winter-blue-600 dark:text-winter-blue-400" />
                <h4 className="text-xl font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                  Download Package Details
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* File Information */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-winter-blue-800 dark:text-winter-blue-200 flex items-center gap-2">
                    <FileArchive className="h-5 w-5" />
                    Package Information
                  </h5>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-winter-blue-50 dark:bg-winter-blue-950 rounded-lg">
                      <span className="text-winter-blue-700 dark:text-winter-blue-300">File name:</span>
                      <span className="font-mono font-semibold text-winter-blue-600 dark:text-winter-blue-400 text-right break-all max-w-[200px]">
                        {fileInfo.fileName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-winter-blue-50 dark:bg-winter-blue-950 rounded-lg">
                      <span className="text-winter-blue-700 dark:text-winter-blue-300">Package size:</span>
                      <span className="font-mono font-semibold text-winter-blue-600 dark:text-winter-blue-400">
                        {formatSize(fileInfo.fileSize)}
                      </span>
                    </div>
                    {fileInfo.fileCount && (
                      <div className="flex justify-between items-center p-3 bg-winter-blue-50 dark:bg-winter-blue-950 rounded-lg">
                        <span className="text-winter-blue-700 dark:text-winter-blue-300">Files included:</span>
                        <span className="font-mono font-semibold text-winter-blue-600 dark:text-winter-blue-400">
                          {fileInfo.fileCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Details */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-warm-amber-800 dark:text-warm-amber-200 flex items-center gap-2">
                    <AudioIcon size="sm" />
                    Audio Enhancement
                  </h5>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-warm-amber-50 dark:bg-warm-amber-950 rounded-lg">
                      <span className="text-warm-amber-700 dark:text-warm-amber-300">Audio format:</span>
                      <span className="font-mono font-semibold text-warm-amber-600 dark:text-warm-amber-400">
                        MP3 (High Quality)
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-warm-amber-50 dark:bg-warm-amber-950 rounded-lg">
                      <span className="text-warm-amber-700 dark:text-warm-amber-300">Enhancement:</span>
                      <span className="font-mono font-semibold text-warm-amber-600 dark:text-warm-amber-400">
                        Winter White Noise
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-warm-amber-50 dark:bg-warm-amber-950 rounded-lg">
                      <span className="text-warm-amber-700 dark:text-warm-amber-300">Compression:</span>
                      <span className="font-mono font-semibold text-warm-amber-600 dark:text-warm-amber-400">
                        ZIP Archive
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Summary */}
              <div className="p-4 bg-gradient-to-r from-ice-gray-50 to-ice-gray-100 dark:from-ice-gray-900 dark:to-ice-gray-800 rounded-xl border border-ice-gray-200 dark:border-ice-gray-700">
                <div className="flex items-start gap-3">
                  <SnowflakeIcon size="sm" className="text-ice-gray-600 dark:text-ice-gray-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-ice-gray-900 dark:text-ice-gray-100">
                      Winter Audio Collection Ready
                    </p>
                    <p className="text-xs text-ice-gray-600 dark:text-ice-gray-400">
                      Your audio files have been enhanced with carefully crafted winter white noise and packaged for download.
                      Enjoy your immersive winter listening experience!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ProcessingCard>
        )}

        {/* Winter-Themed Next Actions */}
        <ProcessingCard className="p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-6 w-6 text-warm-amber-500" />
              <h4 className="text-xl font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                Ready for Another Winter Transformation?
              </h4>
              <Sparkles className="h-6 w-6 text-warm-amber-500" />
            </div>

            <p className="text-ice-gray-600 dark:text-ice-gray-400 leading-relaxed max-w-2xl mx-auto">
              Transform more of your audio collection with our winter audio studio.
              Each processing session creates a unique winter atmosphere for your listening pleasure.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={onStartOver}
                size="lg"
                className="bg-gradient-to-r from-winter-blue-500 to-winter-blue-600 hover:from-winter-blue-600 hover:to-winter-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[200px]"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Process Another Collection
              </Button>

              {status === 'completed' && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Previous download completed successfully</span>
                </div>
              )}
            </div>

            {/* Winter Studio Features Reminder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4 bg-gradient-to-br from-winter-blue-50 to-winter-blue-100 dark:from-winter-blue-950 dark:to-winter-blue-900 rounded-xl border border-winter-blue-200 dark:border-winter-blue-800">
                <SnowflakeIcon size="lg" className="mx-auto mb-2 text-winter-blue-600 dark:text-winter-blue-400" />
                <div className="text-sm font-medium text-winter-blue-700 dark:text-winter-blue-300">
                  Winter Atmosphere
                </div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-warm-amber-50 to-warm-amber-100 dark:from-warm-amber-950 dark:to-warm-amber-900 rounded-xl border border-warm-amber-200 dark:border-warm-amber-800">
                <Zap className="h-8 w-8 mx-auto mb-2 text-warm-amber-600 dark:text-warm-amber-400" />
                <div className="text-sm font-medium text-warm-amber-700 dark:text-warm-amber-300">
                  High Quality Processing
                </div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-ice-gray-50 to-ice-gray-100 dark:from-ice-gray-950 dark:to-ice-gray-900 rounded-xl border border-ice-gray-200 dark:border-ice-gray-800">
                <Music className="h-8 w-8 mx-auto mb-2 text-ice-gray-600 dark:text-ice-gray-400" />
                <div className="text-sm font-medium text-ice-gray-700 dark:text-ice-gray-300">
                  Professional Results
                </div>
              </div>
            </div>
          </div>
        </ProcessingCard>
      </div>
    </div>
  );
};
