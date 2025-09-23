'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoaderIcon, PlayIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { processAllMP3Files, initFFmpeg } from '@/utils/ffmpeg';
import type MP3File from "@/interface/MP3File.tsx";

interface AudioProcessorProps {
  mp3Files: MP3File[];
  whiteNoiseBlob: Blob | null;
  whiteNoiseVolume: number;
  onProcessingComplete: (processedFiles: Array<{ name: string; blob: Blob }>) => void;
}

type ProcessingStatus = 'idle' | 'initializing' | 'processing' | 'completed' | 'error';

export const AudioProcessor = ({ 
  mp3Files, 
  whiteNoiseBlob, 
  whiteNoiseVolume, 
  onProcessingComplete 
}: AudioProcessorProps) => {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentFileProgress, setCurrentFileProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [error, setError] = useState<string>('');

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
      setStatus('initializing');
      setError('');
      setCurrentFileIndex(0);
      setCurrentFileProgress(0);
      setTotalProgress(0);

      // Initialize FFmpeg
      await initFFmpeg();

      setStatus('processing');

      // Process all files
      const processedFiles = await processAllMP3Files(
        mp3Files.map(file => ({ name: file.name, blob: file.blob })),
        whiteNoiseBlob,
        whiteNoiseVolume,
        (fileIndex, fileProgress, totalProgress) => {
          setCurrentFileIndex(fileIndex);
          setCurrentFileProgress(fileProgress);
          setTotalProgress(totalProgress);
        }
      );

      setStatus('completed');
      onProcessingComplete(processedFiles);

    } catch (error) {
      console.error('Processing failed:', error);
      setError(error instanceof Error ? error.message : 'Processing failed');
      setStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'initializing':
      case 'processing':
        return <LoaderIcon className="h-5 w-5 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <PlayIcon className="h-5 w-5" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'initializing':
        return 'Initializing FFmpeg...';
      case 'processing':
        return `Processing ${mp3Files[currentFileIndex]?.name || 'file'} (${currentFileIndex + 1}/${mp3Files.length})`;
      case 'completed':
        return `Successfully processed ${mp3Files.length} files`;
      case 'error':
        return `Error: ${error}`;
      default:
        return 'Ready to process files';
    }
  };

  const isProcessing = status === 'initializing' || status === 'processing';

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold">Audio Processing</h3>
            <p className="text-sm text-muted-foreground">
              Mix white noise with MP3 files at {Math.round(whiteNoiseVolume * 100)}% volume
            </p>
          </div>
        </div>
        
        <Button
          onClick={startProcessing}
          disabled={isProcessing || status === 'completed' || !whiteNoiseBlob}
          className="min-w-[120px]"
        >
          {isProcessing ? (
            <>
              <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
              Processing
            </>
          ) : status === 'completed' ? (
            <>
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Completed
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4 mr-2" />
              Start Processing
            </>
          )}
        </Button>
      </div>

      {/* Status and Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className={status === 'error' ? 'text-red-600' : 'text-muted-foreground'}>
            {getStatusText()}
          </span>
          {isProcessing && (
            <span className="font-mono text-xs">
              {totalProgress}%
            </span>
          )}
        </div>

        {/* Progress Bars */}
        {isProcessing && (
          <div className="space-y-2">
            {/* Current File Progress */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Current file</span>
                <span>{currentFileProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentFileProgress}%` }}
                />
              </div>
            </div>

            {/* Total Progress */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Total progress</span>
                <span>{totalProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Files will be processed sequentially to optimize memory usage</p>
        <p>• Original MP3 quality will be maintained (192kbps)</p>
        <p>• Processing time depends on file size and duration</p>
      </div>
    </div>
  );
};
