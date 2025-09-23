'use client'

import { Button } from '@/components/ui/button';
import { PlayIcon, ArrowLeftIcon, ArrowRightIcon, FileAudioIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { formatSize, formatDuration } from '@/utils/formatters';
import type MP3File from "@/interface/MP3File.tsx";

interface ConfirmationPhaseProps {
  mp3Files: MP3File[];
  whiteNoiseVolume: number;
  onConfirm: () => void;
  onBack: () => void;
}

export const ConfirmationPhase = ({ 
  mp3Files, 
  whiteNoiseVolume, 
  onConfirm, 
  onBack 
}: ConfirmationPhaseProps) => {
  const totalSize = mp3Files.reduce((sum, file) => sum + file.size, 0);
  const totalDuration = mp3Files.reduce((sum, file) => sum + (file.duration || 0), 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Confirm Processing</h3>
        <p className="text-muted-foreground">
          Review your settings and confirm to start processing all files
        </p>
      </div>

      {/* Processing Summary */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="p-6 border rounded-lg bg-muted/20">
          <h4 className="font-semibold text-lg mb-4">Processing Summary</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Files to process</p>
              <p className="text-2xl font-bold">{mp3Files.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total size</p>
              <p className="text-2xl font-bold">{formatSize(totalSize)}</p>
            </div>
          </div>

          {totalDuration > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Total duration</p>
              <p className="text-lg font-semibold">{formatDuration(totalDuration)}</p>
            </div>
          )}

          <div className="flex items-center space-x-2 p-3 bg-background rounded-lg">
            {whiteNoiseVolume > 0 ? (
              <>
                <Volume2Icon className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-600">White noise enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Volume: {Math.round(whiteNoiseVolume * 100)}%
                  </p>
                </div>
              </>
            ) : (
              <>
                <VolumeXIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-muted-foreground">White noise disabled</p>
                  <p className="text-sm text-muted-foreground">
                    Files will be processed without white noise
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* File List Preview */}
        <div className="p-4 border rounded-lg">
          <h5 className="font-medium mb-3">Files to be processed:</h5>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {mp3Files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                <FileAudioIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatSize(file.size)}</span>
                    {file.duration && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(file.duration)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Preview
        </Button>
        <Button onClick={onConfirm} size="lg" className="min-w-[200px]">
          <PlayIcon className="h-4 w-4 mr-2" />
          Start Processing
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>• Processing will add white noise to each MP3 file</p>
        <p>• Original files will not be modified</p>
        <p>• You can download the processed files when complete</p>
      </div>
    </div>
  );
};
