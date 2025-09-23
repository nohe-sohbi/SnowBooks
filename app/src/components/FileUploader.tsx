'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, CheckCircleIcon, ArrowRightIcon, ArrowLeftIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type MP3File from "@/interface/MP3File.tsx";
import whiteNoiseUrl from '@/assets/white-noise.mp3';

// Import phase components
import { UploadPhase } from './workflow/UploadPhase';
import { ExtractionPhase } from './workflow/ExtractionPhase';
import { PreviewPhase } from './workflow/PreviewPhase';
import { ConfirmationPhase } from './workflow/ConfirmationPhase';
import { ProcessingPhase } from './workflow/ProcessingPhase';
import { DownloadPhase } from './workflow/DownloadPhase';

type WorkflowPhase =
  | 'upload'      // User uploads ZIP file
  | 'extracting'  // ZIP is being extracted
  | 'preview'     // User can preview and configure volume
  | 'confirm'     // User confirms to proceed with processing
  | 'processing'  // Files are being processed
  | 'download'    // User can download final ZIP
  | 'error';      // Error state

const FileUploader = () => {
  // Workflow state
  const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>('upload');
  const [error, setError] = useState<string>('');

  // File data
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mp3Files, setMp3Files] = useState<MP3File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<Array<{ name: string; blob: Blob }>>([]);
  const [originalZipName, setOriginalZipName] = useState<string>('');

  // Audio settings
  const [whiteNoiseVolume, setWhiteNoiseVolume] = useState(0.3);
  const [whiteNoiseBlob, setWhiteNoiseBlob] = useState<Blob | null>(null);

  // Progress tracking
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0, fileProgress: 0 });

  // Load white noise file on component mount
  useEffect(() => {
    const loadWhiteNoise = async () => {
      try {
        const response = await fetch(whiteNoiseUrl);
        const blob = await response.blob();
        setWhiteNoiseBlob(blob);
      } catch (error) {
        console.error('Failed to load white noise file:', error);
        setError('Failed to load white noise file. Please refresh the page.');
      }
    };

    loadWhiteNoise();
  }, []);

  // Load volume from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('snowbooks-white-noise-volume');
    if (savedVolume) {
      setWhiteNoiseVolume(parseFloat(savedVolume));
    }
  }, []);

  // Workflow phase handlers
  const handleFileUploaded = (file: File) => {
    setUploadedFile(file);
    setOriginalZipName(file.name);
    setCurrentPhase('extracting');
  };

  const handleExtractionComplete = (files: MP3File[]) => {
    setMp3Files(files);
    setCurrentPhase('preview');
  };

  const handleExtractionError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentPhase('error');
  };

  const handlePreviewComplete = () => {
    setCurrentPhase('confirm');
  };

  const handleConfirmProcessing = () => {
    setCurrentPhase('processing');
  };

  const handleProcessingComplete = (files: Array<{ name: string; blob: Blob }>) => {
    setProcessedFiles(files);
    setCurrentPhase('download');
  };

  const handleProcessingError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentPhase('error');
  };

  const handleStartOver = () => {
    setCurrentPhase('upload');
    setUploadedFile(null);
    setMp3Files([]);
    setProcessedFiles([]);
    setOriginalZipName('');
    setError('');
    setExtractionProgress(0);
    setProcessingProgress({ current: 0, total: 0, fileProgress: 0 });
  };

  const handleBackToPreview = () => {
    setCurrentPhase('preview');
  };

  // Get phase title and description
  const getPhaseInfo = () => {
    switch (currentPhase) {
      case 'upload':
        return { title: 'Upload ZIP File', description: 'Upload a ZIP file containing your MP3 audiobook chapters' };
      case 'extracting':
        return { title: 'Extracting Files', description: 'Extracting MP3 files from your ZIP archive' };
      case 'preview':
        return { title: 'Preview & Configure', description: 'Adjust white noise volume and preview your files' };
      case 'confirm':
        return { title: 'Confirm Processing', description: 'Review settings and confirm to process all files' };
      case 'processing':
        return { title: 'Processing Files', description: 'Adding white noise to your MP3 files' };
      case 'download':
        return { title: 'Download Complete', description: 'Your processed files are ready for download' };
      case 'error':
        return { title: 'Error', description: 'Something went wrong during processing' };
      default:
        return { title: '', description: '' };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with phase info */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">SnowBooks Audio Processor</h1>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-primary">{phaseInfo.title}</h2>
          <p className="text-muted-foreground">{phaseInfo.description}</p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-4">
        {(['upload', 'extracting', 'preview', 'confirm', 'processing', 'download'] as const).map((phase, index) => {
          const isActive = currentPhase === phase;
          const isCompleted = ['upload', 'extracting', 'preview', 'confirm', 'processing', 'download'].indexOf(currentPhase) > index;
          const isError = currentPhase === 'error';

          return (
            <div key={phase} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                isActive && !isError ? "bg-primary text-primary-foreground" : "",
                isCompleted ? "bg-green-500 text-white" : "",
                !isActive && !isCompleted ? "bg-muted text-muted-foreground" : "",
                isError && isActive ? "bg-red-500 text-white" : ""
              )}>
                {isCompleted ? <CheckCircleIcon className="h-4 w-4" /> : index + 1}
              </div>
              {index < 5 && (
                <ArrowRightIcon className={cn(
                  "h-4 w-4 mx-2",
                  isCompleted ? "text-green-500" : "text-muted-foreground"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Phase content */}
      <div className="min-h-[400px]">
        {currentPhase === 'upload' && (
          <UploadPhase onFileUploaded={handleFileUploaded} />
        )}

        {currentPhase === 'extracting' && uploadedFile && (
          <ExtractionPhase
            file={uploadedFile}
            progress={extractionProgress}
            onComplete={handleExtractionComplete}
            onError={handleExtractionError}
            onProgressUpdate={setExtractionProgress}
          />
        )}

        {currentPhase === 'preview' && (
          <PreviewPhase
            mp3Files={mp3Files}
            whiteNoiseBlob={whiteNoiseBlob}
            whiteNoiseVolume={whiteNoiseVolume}
            onVolumeChange={setWhiteNoiseVolume}
            onComplete={handlePreviewComplete}
          />
        )}

        {currentPhase === 'confirm' && (
          <ConfirmationPhase
            mp3Files={mp3Files}
            whiteNoiseVolume={whiteNoiseVolume}
            onConfirm={handleConfirmProcessing}
            onBack={handleBackToPreview}
          />
        )}

        {currentPhase === 'processing' && (
          <ProcessingPhase
            mp3Files={mp3Files}
            whiteNoiseBlob={whiteNoiseBlob}
            whiteNoiseVolume={whiteNoiseVolume}
            progress={processingProgress}
            onComplete={handleProcessingComplete}
            onError={handleProcessingError}
            onProgressUpdate={setProcessingProgress}
          />
        )}

        {currentPhase === 'download' && (
          <DownloadPhase
            processedFiles={processedFiles}
            originalZipName={originalZipName}
            onStartOver={handleStartOver}
          />
        )}

        {currentPhase === 'error' && (
          <div className="text-center space-y-4">
            <AlertCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-red-600">Error</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={handleStartOver} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;