'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoaderIcon, PlayIcon, CheckCircleIcon, AlertCircleIcon, RefreshCwIcon, StopIcon } from 'lucide-react';
import { audioProcessingAPI, type JobProgress, type ProcessingConfig } from '@/services/audioProcessingAPI';
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
        return <LoaderIcon className="h-6 w-6 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircleIcon className="h-6 w-6 text-red-500" />;
      case 'cancelled':
        return <StopIcon className="h-6 w-6 text-orange-500" />;
      default:
        return <PlayIcon className="h-6 w-6 text-primary" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        if (progress) {
          return `Processing ${progress.currentFileName}... (${progress.processedFiles}/${progress.totalFiles})`;
        }
        return 'Starting processing...';
      case 'completed':
        return `Successfully processed ${mp3Files.length} files with white noise`;
      case 'cancelled':
        return 'Processing was cancelled';
      case 'error':
        return `Error: ${error}`;
      default:
        return 'Ready to process your MP3 files with white noise';
    }
  };

  const isProcessing = status === 'processing';

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        {/* Status Card */}
        <div className="p-6 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <h3 className="text-xl font-semibold">Audio Processing</h3>
                <p className="text-muted-foreground">
                  Mix white noise with {mp3Files.length} MP3 files at {Math.round(whiteNoiseVolume * 100)}% volume
                </p>
              </div>
            </div>
            
            {status === 'idle' && (
              <Button
                onClick={startProcessing}
                size="lg"
                className="min-w-[140px]"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Start Processing
              </Button>
            )}

            {status === 'processing' && (
              <Button
                onClick={cancelProcessing}
                variant="outline"
                size="lg"
                className="min-w-[140px]"
              >
                <StopIcon className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            )}

            {(status === 'error' || status === 'cancelled') && (
              <Button
                onClick={reset}
                variant="outline"
                size="lg"
              >
                <RefreshCwIcon className="h-5 w-5 mr-2" />
                Try Again
              </Button>
            )}
          </div>

          {/* Status Text */}
          <div className="mb-4">
            <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
              {getStatusText()}
            </p>
          </div>

          {/* Progress Information */}
          {progress && status === 'processing' && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(progress.totalProgress)}%</span>
              </div>
              <Progress value={progress.totalProgress} className="h-2" />

              <div className="flex justify-between text-sm">
                <span>Current File</span>
                <span>{Math.round(progress.fileProgress)}%</span>
              </div>
              <Progress value={progress.fileProgress} className="h-1" />

              {progress.estimatedTimeRemaining && (
                <p className="text-xs text-muted-foreground">
                  Estimated time remaining: {Math.round(progress.estimatedTimeRemaining / 1000)}s
                </p>
              )}
            </div>
          )}

          {/* Error Information */}
          {status === 'error' && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircleIcon className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Processing Error</p>
                  <p className="text-xs">{error}</p>
                </div>
              </div>
            </div>
          )}



          {/* Completed State */}
          {status === 'completed' && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
                <CheckCircleIcon className="h-5 w-5" />
                <div>
                  <p className="font-medium">Processing Complete!</p>
                  <p className="text-sm">All files have been successfully processed with white noise.</p>
                </div>
              </div>
            </div>
          )}
        </div>



        {/* Processing Info */}
        <div className="p-4 border rounded-lg bg-muted/10">
          <h4 className="font-medium mb-3">Processing Details</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Files to process:</span>
              <span className="font-mono">{mp3Files.length}</span>
            </div>
            <div className="flex justify-between">
              <span>White noise volume:</span>
              <span className="font-mono">{Math.round(whiteNoiseVolume * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Processing method:</span>
              <span className="font-mono">Backend FFmpeg</span>
            </div>
            <div className="flex justify-between">
              <span>Output format:</span>
              <span>MP3 (high quality)</span>
            </div>
          </div>
        </div>

        {/* Processing Notes */}
        <div className="text-xs text-muted-foreground space-y-1 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Processing Notes:</h5>
          <p>• Files are processed on the backend using native FFmpeg</p>
          <p>• White noise is mixed with high quality audio processing</p>
          <p>• Original audio quality is preserved during mixing</p>
          <p>• Processing time depends on file size and server load</p>
          <p>• Real-time progress updates via WebSocket connection</p>
        </div>
      </div>
    </div>
  );
};
