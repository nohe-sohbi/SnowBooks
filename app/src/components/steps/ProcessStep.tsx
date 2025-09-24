'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoaderIcon, PlayIcon, CheckCircleIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { processAllMP3FilesWithWhiteNoise } from '@/utils/audioProcessor';
import type MP3File from "@/interface/MP3File.tsx";

interface ProcessStepProps {
  mp3Files: MP3File[];
  whiteNoiseBlob: Blob | null;
  whiteNoiseVolume: number;
  onProcessingComplete: (processedFiles: Array<{ name: string; blob: Blob }>) => void;
}

type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

export const ProcessStep = ({ 
  mp3Files, 
  whiteNoiseBlob, 
  whiteNoiseVolume, 
  onProcessingComplete 
}: ProcessStepProps) => {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentFileProgress, setCurrentFileProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [processedCount, setProcessedCount] = useState(0);

  const startProcessing = async () => {
    if (!whiteNoiseBlob) {
      setError('White noise file not loaded');
      setStatus('error');
      return;
    }

    if (mp3Files.length === 0) {
      setError('No MP3 files to process');
      setStatus('error');
      return;
    }

    try {
      setStatus('processing');
      setError('');
      setCurrentFileIndex(0);
      setCurrentFileProgress(0);
      setTotalProgress(0);
      setProcessedCount(0);

      // Process all files with actual white noise mixing
      const processedFiles = await processAllMP3FilesWithWhiteNoise(
        mp3Files.map(file => ({ name: file.name, blob: file.blob })),
        whiteNoiseBlob,
        whiteNoiseVolume,
        (fileIndex, fileProgress, totalProgress) => {
          setCurrentFileIndex(fileIndex);
          setCurrentFileProgress(fileProgress);
          setTotalProgress(totalProgress);
          
          // Update processed count when a file is completed
          if (fileProgress === 100) {
            setProcessedCount(fileIndex + 1);
          }
        }
      );

      setStatus('completed');
      setProcessedCount(processedFiles.length);
      onProcessingComplete(processedFiles);

    } catch (error) {
      console.error('Processing failed:', error);
      setError(error instanceof Error ? error.message : 'Processing failed');
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setError('');
    setCurrentFileIndex(0);
    setCurrentFileProgress(0);
    setTotalProgress(0);
    setProcessedCount(0);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <LoaderIcon className="h-6 w-6 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <PlayIcon className="h-6 w-6 text-primary" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return `Processing ${mp3Files[currentFileIndex]?.name || 'file'}... (${processedCount}/${mp3Files.length})`;
      case 'completed':
        return `Successfully processed ${processedCount} files with white noise`;
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

            {status === 'error' && (
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

          {/* Progress Bars */}
          {isProcessing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current file progress</span>
                  <span className="font-mono">{currentFileProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${currentFileProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total progress</span>
                  <span className="font-mono">{totalProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${totalProgress}%` }}
                  />
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
              <span>Web Audio API mixing</span>
            </div>
            <div className="flex justify-between">
              <span>Output format:</span>
              <span>WAV (high quality)</span>
            </div>
          </div>
        </div>

        {/* Processing Notes */}
        <div className="text-xs text-muted-foreground space-y-1 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Processing Notes:</h5>
          <p>• Files are processed sequentially to optimize memory usage</p>
          <p>• White noise is mixed using Web Audio API for high quality results</p>
          <p>• Original audio quality is preserved during mixing</p>
          <p>• Processing time depends on file size and duration</p>
        </div>
      </div>
    </div>
  );
};
