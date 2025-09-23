'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, Square, FileAudioIcon, VolumeXIcon, Volume2Icon, ArrowRightIcon } from 'lucide-react';
import { VolumeControl } from '../VolumeControl';
import { createMixedAudioPreview } from '@/utils/audio';
import { formatSize, formatDuration } from '@/utils/formatters';
import type MP3File from "@/interface/MP3File.tsx";

interface PreviewPhaseProps {
  mp3Files: MP3File[];
  whiteNoiseBlob: Blob | null;
  whiteNoiseVolume: number;
  onVolumeChange: (volume: number) => void;
  onComplete: () => void;
}

export const PreviewPhase = ({ 
  mp3Files, 
  whiteNoiseBlob, 
  whiteNoiseVolume, 
  onVolumeChange, 
  onComplete 
}: PreviewPhaseProps) => {
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isCreatingPreview, setIsCreatingPreview] = useState(false);

  const handlePreview = async (fileIndex: number) => {
    const file = mp3Files[fileIndex];
    
    // Stop current audio if playing
    if (playingIndex === fileIndex && currentAudio) {
      currentAudio.pause();
      URL.revokeObjectURL(currentAudio.src);
      setCurrentAudio(null);
      setPlayingIndex(null);
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      URL.revokeObjectURL(currentAudio.src);
    }

    try {
      setIsCreatingPreview(true);
      let audioBlob = file.blob;
      
      // Create mixed preview with white noise if volume > 0
      if (whiteNoiseBlob && whiteNoiseVolume > 0) {
        const mixedBlob = await createMixedAudioPreview(
          file.blob,
          whiteNoiseBlob,
          whiteNoiseVolume,
          30
        );
        if (mixedBlob) {
          audioBlob = mixedBlob;
        }
      }

      const audio = new Audio();
      const url = URL.createObjectURL(audioBlob);
      audio.src = url;
      
      setCurrentAudio(audio);
      setPlayingIndex(fileIndex);
      setIsCreatingPreview(false);
      
      audio.currentTime = 0;
      audio.play();
      
      const stopAudio = () => {
        audio.pause();
        URL.revokeObjectURL(url);
        setCurrentAudio(null);
        setPlayingIndex(null);
      };

      audio.addEventListener('ended', stopAudio);
      setTimeout(stopAudio, 30000);
      
    } catch (error) {
      console.error('Failed to preview audio:', error);
      setPlayingIndex(null);
      setIsCreatingPreview(false);
    }
  };

  const getPreviewButtonState = (index: number) => {
    if (isCreatingPreview && playingIndex === index) {
      return { icon: Square, text: 'Creating...', disabled: true };
    }
    if (playingIndex === index) {
      return { icon: Square, text: 'Stop', disabled: false };
    }
    return { icon: PlayIcon, text: whiteNoiseVolume > 0 ? 'Preview with White Noise' : 'Preview Original', disabled: false };
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Preview & Configure</h3>
        <p className="text-muted-foreground">
          Adjust the white noise volume and preview how your files will sound after processing
        </p>
      </div>

      {/* Volume Control */}
      <div className="max-w-2xl mx-auto">
        <VolumeControl
          volume={whiteNoiseVolume}
          onVolumeChange={onVolumeChange}
        />
      </div>

      {/* White Noise Status */}
      <div className="flex items-center justify-center space-x-2 text-sm">
        {whiteNoiseVolume > 0 ? (
          <>
            <Volume2Icon className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">
              White noise will be added at {Math.round(whiteNoiseVolume * 100)}% volume
            </span>
          </>
        ) : (
          <>
            <VolumeXIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              No white noise will be added (volume is 0%)
            </span>
          </>
        )}
      </div>

      {/* File List */}
      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold text-lg">MP3 Files ({mp3Files.length})</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Click the play button to preview each file with white noise mixed in
          </p>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {mp3Files.map((file, index) => {
            const buttonState = getPreviewButtonState(index);
            const ButtonIcon = buttonState.icon;
            
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
              >
                <FileAudioIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-sm truncate mb-1" title={file.name}>
                    {file.name}
                  </h5>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{formatSize(file.size)}</span>
                    {file.duration && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{formatDuration(file.duration)}</span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(index)}
                  disabled={buttonState.disabled}
                  className="flex-shrink-0 h-8 w-8 p-0"
                  title={`${buttonState.text} (30s)`}
                >
                  <ButtonIcon className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={onComplete} size="lg" className="min-w-[200px]">
          Continue to Processing
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>• Preview shows exactly how files will sound after processing</p>
        <p>• White noise volume can be adjusted anytime</p>
        <p>• Settings are automatically saved for future sessions</p>
      </div>
    </div>
  );
};
