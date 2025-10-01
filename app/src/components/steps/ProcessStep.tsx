'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loading } from '@/components/ui/loading';
import { ErrorIcon } from '@/components/ui/icon';
import { Play, Square, CheckCircle2, RefreshCw } from 'lucide-react';
import { audioProcessingAPI, type JobProgress, type ProcessingConfig } from '@/services/audioProcessingAPI';
import type MP3File from "@/interface/MP3File";

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
        return <Loading size="lg" />;
      case 'completed':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case 'error':
        return <ErrorIcon size="lg" />;
      case 'cancelled':
        return <Square className="h-8 w-8 text-orange-500" />;
      default:
        return <Play className="h-8 w-8 text-blue-500" />;
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Processing Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            {getStatusIcon()}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {status === 'idle' && 'Ready to Process'}
            {status === 'processing' && 'Processing Audio'}
            {status === 'completed' && 'Processing Complete'}
            {status === 'error' && 'Processing Error'}
            {status === 'cancelled' && 'Processing Cancelled'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {getStatusText()}
          </p>
        </div>

        {/* File Summary */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {mp3Files.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Audio Files
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round(whiteNoiseVolume * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                White Noise Volume
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          {status === 'idle' && (
            <Button
              onClick={startProcessing}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Processing
            </Button>
          )}

          {status === 'processing' && (
            <Button
              onClick={cancelProcessing}
              variant="outline"
              size="lg"
              className="px-8 py-3 text-lg"
            >
              <Square className="h-5 w-5 mr-2" />
              Cancel Processing
            </Button>
          )}

          {(status === 'error' || status === 'cancelled') && (
            <Button
              onClick={reset}
              variant="outline"
              size="lg"
              className="px-8 py-3 text-lg"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>

      {/* Progress Display */}
      {progress && status === 'processing' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Processing Progress
          </h4>

          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {Math.round(progress.totalProgress)}%
              </span>
            </div>
            <Progress value={progress.totalProgress} className="h-2" />
          </div>

          {/* Current File */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Current: {progress.currentFileName}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {Math.round(progress.fileProgress)}%
              </span>
            </div>
            <Progress value={progress.fileProgress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {progress.processedFiles}/{progress.totalFiles}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Files</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {progress.estimatedTimeRemaining
                  ? `${Math.round(progress.estimatedTimeRemaining / 1000)}s`
                  : '~'
                }
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {getProcessingStage() ? '...' : 'Ready'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Status</div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-red-500 mt-0.5">
              <ErrorIcon size="sm" />
            </div>
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                Processing Failed
              </h4>
              <p className="text-red-700 dark:text-red-300 text-sm">
                {error}
              </p>
              <button
                onClick={reset}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {status === 'completed' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-green-500 mt-0.5">
              <CheckCircle2 />
            </div>
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                Processing Complete!
              </h4>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Successfully processed {mp3Files.length} audio files with {Math.round(whiteNoiseVolume * 100)}% white noise.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
