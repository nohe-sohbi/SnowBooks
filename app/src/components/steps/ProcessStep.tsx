'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AudioCard, ProcessingCard } from '@/components/ui/card';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { AudioProcessingLoader, SnowflakeLoader } from '@/components/ui/loading';
import { AudioIcon, SnowflakeIcon, SuccessIcon, ErrorIcon } from '@/components/ui/icon';
import { Play, Square, CheckCircle2, AlertTriangle, RefreshCw, Cog, Waves, Music, Clock, Zap, Settings } from 'lucide-react';
import { audioProcessingAPI, type JobProgress, type ProcessingConfig } from '@/services/audioProcessingAPI';
import { cn } from '@/lib/utils';
import type MP3File from "@/interface/MP3File.tsx";

interface ProcessStepProps {
  mp3Files: MP3File[];
  whiteNoiseVolume: number;
  jobId: string;
  onProcessingComplete: (downloadUrl: string) => void;
}

type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error' | 'cancelled';

export const ProcessStep = ({
  mp3Files,
  whiteNoiseVolume,
  jobId,
  onProcessingComplete
}: ProcessStepProps) => {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [error, setError] = useState<string>('');
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  // Cleanup WebSocket subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  const startProcessing = async () => {
    if (mp3Files.length === 0) {
      setError('No MP3 files to process');
      setStatus('error');
      return;
    }

    try {
      setStatus('processing');
      setError('');
      setProgress(null);

      // Subscribe to progress updates
      const unsubscribeFn = audioProcessingAPI.subscribeToProgress(
        jobId,
        (progressUpdate: JobProgress) => {
          setProgress(progressUpdate);
        },
        (result: any) => {
          setStatus('completed');
          onProcessingComplete(result.downloadUrl || `/api/download/${jobId}`);
        },
        (errorMessage: string) => {
          setError(errorMessage);
          setStatus('error');
        }
      );
      setUnsubscribe(() => unsubscribeFn);

      // Start processing on backend
      const config: ProcessingConfig = {
        whiteNoiseVolume,
        outputFormat: 'mp3',
        quality: 'medium',
      };

      await audioProcessingAPI.startProcessing(jobId, config);

    } catch (error) {
      console.error('Processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const cancelProcessing = async () => {
    try {
      await audioProcessingAPI.cancelJob(jobId);
      setStatus('cancelled');
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
    } catch (error) {
      console.error('Failed to cancel processing:', error);
    }
  };

  const reset = () => {
    setStatus('idle');
    setError('');
    setProgress(null);
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <AudioProcessingLoader size="lg" />;
      case 'completed':
        return <SuccessIcon size="xl" />;
      case 'error':
        return <ErrorIcon size="xl" />;
      case 'cancelled':
        return <Square className="h-8 w-8 text-warm-amber-500" />;
      default:
        return <Play className="h-8 w-8 text-winter-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-winter-blue-600 dark:text-winter-blue-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'cancelled':
        return 'text-warm-amber-600 dark:text-warm-amber-400';
      default:
        return 'text-winter-blue-600 dark:text-winter-blue-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        if (progress) {
          return `Crafting winter atmosphere for ${progress.currentFileName}... (${progress.processedFiles}/${progress.totalFiles})`;
        }
        return 'Initializing winter audio processing...';
      case 'completed':
        return `Successfully enhanced ${mp3Files.length} files with winter ambience`;
      case 'cancelled':
        return 'Winter processing was paused';
      case 'error':
        return `Processing encountered an issue: ${error}`;
      default:
        return 'Ready to transform your audio collection with winter white noise';
    }
  };

  const getProcessingStage = () => {
    if (!progress || status !== 'processing') return null;

    if (progress.totalProgress < 20) return 'Extracting audio essence...';
    if (progress.totalProgress < 60) return 'Mixing winter atmosphere...';
    if (progress.totalProgress < 90) return 'Finalizing winter enhancement...';
    return 'Completing audio transformation...';
  };

  const isProcessing = status === 'processing';

  return (
    <div className="space-y-8">
      <div className="max-w-5xl mx-auto">
        {/* Winter Audio Studio Header */}
        <AudioCard className="relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-winter-blue-500 to-warm-amber-500" />

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="p-4 rounded-full bg-gradient-to-br from-winter-blue-100 to-warm-amber-100 dark:from-winter-blue-900 dark:to-warm-amber-900">
                  <Cog className="h-8 w-8 text-winter-blue-600 dark:text-winter-blue-400" />
                </div>
                <SnowflakeIcon size="xl" className="text-warm-amber-500" />
              </div>

              <h3 className="text-3xl font-display font-bold bg-gradient-to-r from-winter-blue-900 to-winter-blue-600 bg-clip-text text-transparent mb-3">
                Winter Audio Processing
              </h3>
              <p className="text-ice-gray-600 dark:text-ice-gray-400 leading-relaxed max-w-2xl mx-auto">
                Transform your audio collection with carefully crafted winter white noise atmosphere
              </p>
            </div>

            {/* Processing Status Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  {getStatusIcon()}
                  {status === 'processing' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-warm-amber-500 rounded-full animate-pulse" />
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className={cn("text-2xl font-semibold", getStatusColor())}>
                    {status === 'idle' && 'Ready to Process'}
                    {status === 'processing' && 'Processing Audio'}
                    {status === 'completed' && 'Processing Complete'}
                    {status === 'error' && 'Processing Error'}
                    {status === 'cancelled' && 'Processing Cancelled'}
                  </h4>
                  <p className="text-ice-gray-600 dark:text-ice-gray-400">
                    {mp3Files.length} files • {Math.round(whiteNoiseVolume * 100)}% white noise intensity
                  </p>
                  {getProcessingStage() && (
                    <p className="text-sm text-winter-blue-600 dark:text-winter-blue-400 font-medium">
                      {getProcessingStage()}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {status === 'idle' && (
                  <Button
                    onClick={startProcessing}
                    size="lg"
                    className="bg-gradient-to-r from-winter-blue-500 to-winter-blue-600 hover:from-winter-blue-600 hover:to-winter-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[180px]"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Begin Winter Processing
                  </Button>
                )}

                {status === 'processing' && (
                  <Button
                    onClick={cancelProcessing}
                    variant="outline"
                    size="lg"
                    className="border-warm-amber-300 dark:border-warm-amber-600 text-warm-amber-600 dark:text-warm-amber-400 hover:bg-warm-amber-50 dark:hover:bg-warm-amber-950 min-w-[140px]"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Pause Processing
                  </Button>
                )}

                {(status === 'error' || status === 'cancelled') && (
                  <Button
                    onClick={reset}
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
            <div className="text-center">
              <p className={cn(
                "text-lg leading-relaxed",
                status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-ice-gray-600 dark:text-ice-gray-400'
              )}>
                {getStatusText()}
              </p>
            </div>
          </div>
        </AudioCard>
          </div>

        {/* Winter-Themed Progress Visualization */}
        {progress && status === 'processing' && (
          <ProcessingCard className="mb-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <Waves className="h-6 w-6 text-winter-blue-600 dark:text-winter-blue-400" />
                <h4 className="text-xl font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                  Processing Progress
                </h4>
              </div>

              {/* Overall Progress with Waveform */}
              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-winter-blue-800 dark:text-winter-blue-200">
                    Overall Progress
                  </h5>
                  <span className="text-2xl font-bold text-winter-blue-600 dark:text-winter-blue-400 tabular-nums">
                    {Math.round(progress.totalProgress)}%
                  </span>
                </div>

                {/* Animated Waveform Progress */}
                <div className="relative h-16 bg-gradient-to-r from-winter-blue-50 to-warm-amber-50 dark:from-winter-blue-950 dark:to-warm-amber-950 rounded-xl overflow-hidden border border-winter-blue-200 dark:border-winter-blue-800">
                  <div className="absolute inset-0 flex items-center justify-center gap-1 px-4">
                    {Array.from({ length: 50 }, (_, i) => {
                      const progressPoint = progress.totalProgress / 100;
                      const isActive = i / 50 <= progressPoint;
                      const height = Math.sin((i / 50) * Math.PI * 8 + Date.now() / 300) * 0.4 + 0.6;

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
                            height: `${height * 50}px`,
                            opacity: isActive ? 0.9 : 0.3,
                            animationDelay: `${i * 30}ms`
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Progress Overlay */}
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-winter-blue-400/20 to-warm-amber-400/20 transition-all duration-500"
                    style={{ width: `${progress.totalProgress}%` }}
                  />
                </div>

                <Progress
                  value={progress.totalProgress}
                  variant="audio"
                  className="h-3"
                />
              </div>

              {/* Current File Progress */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Music className="h-5 w-5 text-warm-amber-500" />
                    <h5 className="font-semibold text-warm-amber-800 dark:text-warm-amber-200">
                      Current File: {progress.currentFileName}
                    </h5>
                  </div>
                  <span className="text-lg font-bold text-warm-amber-600 dark:text-warm-amber-400 tabular-nums">
                    {Math.round(progress.fileProgress)}%
                  </span>
                </div>

                <Progress
                  value={progress.fileProgress}
                  variant="audio"
                  className="h-2"
                />
              </div>

              {/* Processing Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Files Processed */}
                <div className="text-center p-4 bg-gradient-to-br from-winter-blue-50 to-winter-blue-100 dark:from-winter-blue-950 dark:to-winter-blue-900 rounded-xl border border-winter-blue-200 dark:border-winter-blue-800">
                  <div className="text-2xl font-bold text-winter-blue-600 dark:text-winter-blue-400 mb-1">
                    {progress.processedFiles}/{progress.totalFiles}
                  </div>
                  <div className="text-sm font-medium text-winter-blue-600 dark:text-winter-blue-400">
                    Files Processed
                  </div>
                </div>

                {/* Time Remaining */}
                <div className="text-center p-4 bg-gradient-to-br from-warm-amber-50 to-warm-amber-100 dark:from-warm-amber-950 dark:to-warm-amber-900 rounded-xl border border-warm-amber-200 dark:border-warm-amber-800">
                  <div className="text-2xl font-bold text-warm-amber-600 dark:text-warm-amber-400 mb-1">
                    {progress.estimatedTimeRemaining
                      ? `${Math.round(progress.estimatedTimeRemaining / 1000)}s`
                      : '~'
                    }
                  </div>
                  <div className="text-sm font-medium text-warm-amber-600 dark:text-warm-amber-400">
                    Time Remaining
                  </div>
                </div>

                {/* Processing Speed */}
                <div className="text-center p-4 bg-gradient-to-br from-ice-gray-50 to-ice-gray-100 dark:from-ice-gray-950 dark:to-ice-gray-900 rounded-xl border border-ice-gray-200 dark:border-ice-gray-800">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-6 w-6 text-ice-gray-600 dark:text-ice-gray-400" />
                  </div>
                  <div className="text-sm font-medium text-ice-gray-600 dark:text-ice-gray-400">
                    High Quality
                  </div>
                </div>
              </div>

              {/* Processing Stage Indicator */}
              <div className="mt-6 p-4 bg-gradient-to-r from-ice-gray-50 to-ice-gray-100 dark:from-ice-gray-900 dark:to-ice-gray-800 rounded-xl border border-ice-gray-200 dark:border-ice-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-winter-blue-500 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-warm-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="w-2 h-2 bg-winter-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                  </div>
                  <span className="text-sm font-medium text-ice-gray-700 dark:text-ice-gray-300">
                    {getProcessingStage()}
                  </span>
                </div>
              </div>
            </div>
          </ProcessingCard>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="mb-8 animate-in slide-in-from-bottom-4 duration-300">
            <ErrorAlert
              title="Processing Error"
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

                    {/* Audio Processing Error Guidance */}
                    <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                      <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        Audio Processing Tips:
                      </h5>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        <li>• Check that all audio files are valid MP3 format</li>
                        <li>• Ensure stable internet connection for processing</li>
                        <li>• Try reducing the number of files if processing large batches</li>
                        <li>• Verify that white noise volume is within acceptable range</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </ErrorAlert>
          </div>
        )}

        {/* Success State */}
        {status === 'completed' && (
          <div className="mb-8 animate-in slide-in-from-bottom-4 duration-300">
            <SuccessAlert
              title="Winter Processing Complete!"
              className="border-l-4 border-l-green-500"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <SuccessIcon size="sm" />
                  <span className="font-medium">Successfully enhanced {mp3Files.length} audio files</span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-green-700 dark:text-green-300">
                  <div className="flex items-center gap-1">
                    <AudioIcon size="xs" />
                    <span>{mp3Files.length} files processed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <SnowflakeIcon size="xs" />
                    <span>{Math.round(whiteNoiseVolume * 100)}% white noise mixed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>High quality output</span>
                  </div>
                </div>

                <p className="text-green-600 dark:text-green-400 text-sm leading-relaxed">
                  Your audio collection has been transformed with the perfect winter atmosphere!
                  All files are ready for download with the configured white noise enhancement.
                </p>
              </div>
            </SuccessAlert>
          </div>
        )}
        </div>



        {/* Winter-Themed Processing Configuration */}
        <ProcessingCard className="p-8 mb-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="h-6 w-6 text-winter-blue-600 dark:text-winter-blue-400" />
              <h4 className="text-xl font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                Processing Configuration
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Audio Configuration */}
              <div className="space-y-4">
                <h5 className="font-semibold text-winter-blue-800 dark:text-winter-blue-200 flex items-center gap-2">
                  <AudioIcon size="sm" />
                  Audio Settings
                </h5>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-3 bg-winter-blue-50 dark:bg-winter-blue-950 rounded-lg">
                    <span className="text-winter-blue-700 dark:text-winter-blue-300">Files to process:</span>
                    <span className="font-mono font-semibold text-winter-blue-600 dark:text-winter-blue-400">{mp3Files.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-winter-blue-50 dark:bg-winter-blue-950 rounded-lg">
                    <span className="text-winter-blue-700 dark:text-winter-blue-300">White noise intensity:</span>
                    <span className="font-mono font-semibold text-winter-blue-600 dark:text-winter-blue-400">{Math.round(whiteNoiseVolume * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-winter-blue-50 dark:bg-winter-blue-950 rounded-lg">
                    <span className="text-winter-blue-700 dark:text-winter-blue-300">Output format:</span>
                    <span className="font-mono font-semibold text-winter-blue-600 dark:text-winter-blue-400">MP3 (High Quality)</span>
                  </div>
                </div>
              </div>

              {/* Technical Configuration */}
              <div className="space-y-4">
                <h5 className="font-semibold text-warm-amber-800 dark:text-warm-amber-200 flex items-center gap-2">
                  <Cog size="sm" />
                  Technical Details
                </h5>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-3 bg-warm-amber-50 dark:bg-warm-amber-950 rounded-lg">
                    <span className="text-warm-amber-700 dark:text-warm-amber-300">Processing engine:</span>
                    <span className="font-mono font-semibold text-warm-amber-600 dark:text-warm-amber-400">FFmpeg Backend</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warm-amber-50 dark:bg-warm-amber-950 rounded-lg">
                    <span className="text-warm-amber-700 dark:text-warm-amber-300">Quality preservation:</span>
                    <span className="font-mono font-semibold text-warm-amber-600 dark:text-warm-amber-400">Lossless Mixing</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warm-amber-50 dark:bg-warm-amber-950 rounded-lg">
                    <span className="text-warm-amber-700 dark:text-warm-amber-300">Progress updates:</span>
                    <span className="font-mono font-semibold text-warm-amber-600 dark:text-warm-amber-400">Real-time WebSocket</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ProcessingCard>

        {/* Winter-Themed Processing Notes */}
        <ProcessingCard className="p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-winter-blue-100 dark:bg-winter-blue-900">
                <Waves className="h-5 w-5 text-winter-blue-600 dark:text-winter-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                Winter Audio Processing Notes
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h5 className="font-medium text-winter-blue-800 dark:text-winter-blue-200 flex items-center gap-2">
                  <Cog className="h-4 w-4" />
                  Processing Features
                </h5>
                <ul className="text-sm text-winter-blue-700 dark:text-winter-blue-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-winter-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span>High-quality audio processing using native FFmpeg backend</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-winter-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span>Lossless white noise mixing preserves original audio quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-winter-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span>Real-time progress updates via WebSocket connection</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h5 className="font-medium text-warm-amber-800 dark:text-warm-amber-200 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Performance Notes
                </h5>
                <ul className="text-sm text-warm-amber-700 dark:text-warm-amber-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-warm-amber-500 rounded-full mt-2 flex-shrink-0" />
                    <span>Processing time varies based on file size and server load</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-warm-amber-500 rounded-full mt-2 flex-shrink-0" />
                    <span>Larger files may take longer but maintain quality standards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-warm-amber-500 rounded-full mt-2 flex-shrink-0" />
                    <span>Processing can be paused and resumed as needed</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-ice-gray-50 to-ice-gray-100 dark:from-ice-gray-900 dark:to-ice-gray-800 rounded-xl border border-ice-gray-200 dark:border-ice-gray-700">
              <div className="flex items-start gap-3">
                <SnowflakeIcon size="sm" className="text-ice-gray-600 dark:text-ice-gray-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-ice-gray-900 dark:text-ice-gray-100">
                    Winter Audio Enhancement
                  </p>
                  <p className="text-xs text-ice-gray-600 dark:text-ice-gray-400">
                    Your audio files will be enhanced with carefully crafted winter white noise to create the perfect ambient listening experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ProcessingCard>
      </div>
    </div>
  );
};
