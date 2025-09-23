'use client'

import { useEffect } from 'react';
import { LoaderIcon, FileAudioIcon, CheckCircleIcon } from 'lucide-react';
import { processAllMP3Files } from '@/utils/ffmpeg';
import type MP3File from "@/interface/MP3File.tsx";

interface ProcessingPhaseProps {
  mp3Files: MP3File[];
  whiteNoiseBlob: Blob | null;
  whiteNoiseVolume: number;
  progress: { current: number; total: number; fileProgress: number };
  onComplete: (files: Array<{ name: string; blob: Blob }>) => void;
  onError: (error: string) => void;
  onProgressUpdate: (progress: { current: number; total: number; fileProgress: number }) => void;
}

export const ProcessingPhase = ({ 
  mp3Files, 
  whiteNoiseBlob, 
  whiteNoiseVolume, 
  progress, 
  onComplete, 
  onError, 
  onProgressUpdate 
}: ProcessingPhaseProps) => {
  
  useEffect(() => {
    const processFiles = async () => {
      if (!whiteNoiseBlob) {
        onError('White noise file not loaded');
        return;
      }

      if (mp3Files.length === 0) {
        onError('No MP3 files to process');
        return;
      }

      try {
        onProgressUpdate({ current: 0, total: mp3Files.length, fileProgress: 0 });

        const processedFiles = await processAllMP3Files(
          mp3Files.map(file => ({ name: file.name, blob: file.blob })),
          whiteNoiseBlob,
          whiteNoiseVolume,
          (fileIndex, fileProgress, _totalProgress) => {
            onProgressUpdate({
              current: fileIndex + 1,
              total: mp3Files.length,
              fileProgress: fileProgress
            });
          }
        );

        onComplete(processedFiles);
        
      } catch (error) {
        console.error('Processing failed:', error);
        onError(error instanceof Error ? error.message : 'Processing failed');
      }
    };

    processFiles();
  }, [mp3Files, whiteNoiseBlob, whiteNoiseVolume, onComplete, onError, onProgressUpdate]);

  const currentFile = progress.current > 0 ? mp3Files[progress.current - 1] : mp3Files[0];
  const totalProgress = progress.total > 0 ? Math.round(((progress.current - 1 + progress.fileProgress / 100) / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="text-center space-y-4">
        <LoaderIcon className="h-16 w-16 text-primary animate-spin mx-auto" />
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Processing Files</h3>
          <p className="text-muted-foreground">
            Adding white noise to your MP3 files at {Math.round(whiteNoiseVolume * 100)}% volume
          </p>
        </div>
      </div>

      {/* Current File */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <FileAudioIcon className="h-5 w-5 text-primary" />
          <span className="font-medium">
            Processing: {currentFile?.name || 'Preparing...'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          File {progress.current} of {progress.total}
        </p>
      </div>

      {/* Progress Bars */}
      <div className="w-full max-w-md space-y-4">
        {/* Current File Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current file</span>
            <span>{progress.fileProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.fileProgress}%` }}
            />
          </div>
        </div>

        {/* Total Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total progress</span>
            <span>{totalProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* File Status List */}
      <div className="w-full max-w-2xl">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {mp3Files.map((file, index) => {
            const isCompleted = index < progress.current - 1;
            const isCurrent = index === progress.current - 1;
            
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded transition-colors ${
                  isCompleted ? 'bg-green-50 text-green-700' :
                  isCurrent ? 'bg-blue-50 text-blue-700' :
                  'bg-muted/30 text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                ) : isCurrent ? (
                  <LoaderIcon className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <FileAudioIcon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="text-xs ml-auto">
                  {isCompleted ? 'Complete' : isCurrent ? 'Processing...' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>• Files are processed sequentially for optimal performance</p>
        <p>• Original MP3 quality is maintained (192kbps)</p>
        <p>• Processing time depends on file size and duration</p>
      </div>
    </div>
  );
};
