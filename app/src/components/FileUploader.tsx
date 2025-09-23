'use client'

import { useState, useEffect } from 'react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, CheckCircleIcon, LoaderIcon, UploadIcon, PlayIcon, Square, FileAudioIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import { formatSize, formatDuration } from '@/utils/formatters';
import { getAudioDuration, createMixedAudioPreview } from '@/utils/audio';
import type MP3File from "@/interface/MP3File.tsx";
import { VolumeControl } from './VolumeControl';
import { AudioProcessor } from './AudioProcessor';
import { ZipExporter } from './ZipExporter';
import whiteNoiseUrl from '@/assets/white-noise.mp3';

type Status = 'idle' | 'extracting' | 'completed' | 'error';

const FileUploader = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [mp3Files, setMp3Files] = useState<MP3File[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [whiteNoiseVolume, setWhiteNoiseVolume] = useState(0.3);
  const [whiteNoiseBlob, setWhiteNoiseBlob] = useState<Blob | null>(null);
  const [processedFiles, setProcessedFiles] = useState<Array<{ name: string; blob: Blob }>>([]);
  const [originalZipName, setOriginalZipName] = useState<string>('');

  useEffect(() => {
    const loadWhiteNoise = async () => {
      try {
        const response = await fetch(whiteNoiseUrl);
        const blob = await response.blob();
        setWhiteNoiseBlob(blob);
      } catch (error) {
        console.error('Failed to load white noise file:', error);
      }
    };

    loadWhiteNoise();
  }, []);

  const handleDrop = async (droppedFiles: File[]) => {
    if (droppedFiles.length === 0) return;

    const zipFile = droppedFiles[0];
    setOriginalZipName(zipFile.name);
    setFiles([zipFile]);
    setStatus('extracting');
    setError('');
    setProgress(0);

    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(zipFile);

      const mp3Entries = Object.keys(zipData.files).filter(fileName => 
        !zipData.files[fileName].dir && fileName.toLowerCase().endsWith('.mp3')
      );

      if (mp3Entries.length === 0) {
        setError('No MP3 files found in ZIP');
        setStatus('error');
        return;
      }

      const extractedFiles: MP3File[] = [];
      
      for (let i = 0; i < mp3Entries.length; i++) {
        const fileName = mp3Entries[i];
        setProgress(((i + 1) / mp3Entries.length) * 100);
        
        try {
          const file = zipData.files[fileName];
          const blob = await file.async('blob');
          const duration = await getAudioDuration(blob);
          
          extractedFiles.push({
            name: fileName.split('/').pop() || fileName,
            size: blob.size,
            duration,
            blob
          });
        } catch (err) {
          console.warn(`Failed to process ${fileName}:`, err);
        }
      }

      setMp3Files(extractedFiles);
      setStatus('completed');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process ZIP file');
      setStatus('error');
    }
  };

  const handlePreview = async (fileIndex: number) => {
    const file = mp3Files[fileIndex];

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
      let audioBlob = file.blob;

      // If white noise is loaded and volume > 0, create mixed preview
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
    }
  };



  const reset = () => {
    if (currentAudio) {
      currentAudio.pause();
      URL.revokeObjectURL(currentAudio.src);
      setCurrentAudio(null);
    }
    setFiles([]);
    setMp3Files([]);
    setStatus('idle');
    setError('');
    setProgress(0);
    setPlayingIndex(null);
    setProcessedFiles([]);
  };

  const handleProcessingComplete = (files: Array<{ name: string; blob: Blob }>) => {
    setProcessedFiles(files);
  };



  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Dropzone
          accept={{ 'application/zip': ['.zip'] }}
          maxFiles={1}
          maxSize={500 * 1024 * 1024} // 500MB
          onDrop={handleDrop}
          onError={(error) => {
            setStatus('error');
            setError(error.message);
          }}
          src={files}
          disabled={status === 'extracting'}
          className={cn(
            "transition-colors",
            status === 'extracting' && "opacity-50 cursor-not-allowed"
          )}
        >
          <DropzoneEmptyState>
            <div className="space-y-2">
              <UploadIcon className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-lg font-medium">Upload ZIP file with MP3 chapters</p>
              <p className="text-sm text-muted-foreground">
                Drop your ZIP file here or click to browse (max 500MB)
              </p>
            </div>
          </DropzoneEmptyState>
          <DropzoneContent />
        </Dropzone>

        {status === 'extracting' && (
          <div className="flex items-center space-x-2 text-blue-600">
            <LoaderIcon className="h-4 w-4 animate-spin" />
            <span>Extracting MP3 files... {Math.round(progress)}%</span>
          </div>
        )}
        
        {status === 'completed' && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircleIcon className="h-4 w-4" />
            <span>Found {mp3Files.length} MP3 file(s)</span>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircleIcon className="h-4 w-4" />
            <span>Error: {error}</span>
          </div>
        )}

        {status === 'extracting' && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {mp3Files.length > 0 && (
        <VolumeControl
          volume={whiteNoiseVolume}
          onVolumeChange={setWhiteNoiseVolume}
        />
      )}

      {mp3Files.length > 0 && (
        <AudioProcessor
          mp3Files={mp3Files}
          whiteNoiseBlob={whiteNoiseBlob}
          whiteNoiseVolume={whiteNoiseVolume}
          onProcessingComplete={handleProcessingComplete}
        />
      )}

      {processedFiles.length > 0 && (
        <ZipExporter
          processedFiles={processedFiles}
          originalZipName={originalZipName}
        />
      )}

      {mp3Files.length > 0 && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-lg">MP3 Files ({mp3Files.length})</h3>
            <p className="text-sm text-muted-foreground mt-1">All files will be processed with white noise</p>
          </div>

          <div className="space-y-3">
            {mp3Files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
              >
                <FileAudioIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate mb-1" title={file.name}>
                    {file.name}
                  </h4>
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
                  className="flex-shrink-0 h-8 w-8 p-0"
                  title={
                    playingIndex === index
                      ? "Stop preview"
                      : whiteNoiseVolume > 0
                        ? "Preview with white noise (30s)"
                        : "Preview audio (30s)"
                  }
                >
                  {playingIndex === index ? (
                    <Square className="h-4 w-4 fill-current" />
                  ) : (
                    <PlayIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(status === 'completed' || status === 'error') && (
        <div className="flex justify-center">
          <Button onClick={reset} variant="outline">
            Upload Another ZIP File
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;