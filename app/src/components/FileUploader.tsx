'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StepWizard } from './StepWizard';
import { UploadStep } from './steps/UploadStep';
import { ConfigureStep } from './steps/ConfigureStep';
import { PreviewStep } from './steps/PreviewStep';
import { DownloadStep } from './steps/DownloadStep';
import { ErrorBoundary } from './ErrorBoundary';
import type MP3File from "@/interface/MP3File";
const WHITE_NOISE_PUBLIC_URL = '/white-noise.mp3';
import { cleanupAudioContext } from '@/utils/audio';
import { audioProcessingAPI, type JobProgress, type ProcessingConfig } from '@/services/audioProcessingAPI';
import { Progress } from '@/components/ui/progress';


const FileUploader = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [mp3Files, setMp3Files] = useState<MP3File[]>([]);
  const [whiteNoiseVolume, setWhiteNoiseVolume] = useState(0.3);
  const [whiteNoiseBlob, setWhiteNoiseBlob] = useState<Blob | null>(null);
  const [processedFiles, setProcessedFiles] = useState<Array<{ name: string; blob: Blob }>>([]);
  const [originalZipName, setOriginalZipName] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [stepCompletions, setStepCompletions] = useState<boolean[]>([false, false, false, false]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string>('');
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Demo mode for testing UI without backend
  const [demoMode, setDemoMode] = useState(false);

  // Load white noise file on component mount
  useEffect(() => {
    const loadWhiteNoise = async () => {
      try {
        const response = await fetch(WHITE_NOISE_PUBLIC_URL);
        const blob = await response.blob();
        setWhiteNoiseBlob(blob);
      } catch (error) {
        console.error('Failed to load white noise file:', error);
      }
    };

    loadWhiteNoise();
  }, []);

  // Load saved volume from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('snowbooks-white-noise-volume');
    if (savedVolume) {
      setWhiteNoiseVolume(parseFloat(savedVolume));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioContext();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  // Step completion handlers
  const markStepComplete = (stepIndex: number) => {
    setStepCompletions(prev => {
      const newCompletions = [...prev];
      newCompletions[stepIndex] = true;
      return newCompletions;
    });
  };

  // Memoized step event handlers to prevent unnecessary re-renders
  const handleFilesExtracted = useCallback((files: MP3File[], zipName: string, uploadJobId: string) => {
    setMp3Files(files);
    setOriginalZipName(zipName);
    setJobId(uploadJobId);
    markStepComplete(0);
    setCurrentStep(1); // Move to configure step
  }, []);

  const handleUploadError = useCallback((error: string) => {
    console.error('Upload error:', error);
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    setWhiteNoiseVolume(volume);
    markStepComplete(1); // Mark configure step as complete when volume is set
  }, []);



  const handleStartOver = useCallback(() => {
    setCurrentStep(0);
    setMp3Files([]);
    setProcessedFiles([]);
    setOriginalZipName('');
    setStepCompletions([false, false, false, false]);
    if (unsubscribe) {
      unsubscribe();
    }
    setIsProcessing(false);
    setProcessingError('');
    setProgress(null);
    setDemoMode(false);
  }, []);

  // Demo mode handler
  const enableDemoMode = useCallback(() => {
    setDemoMode(true);
    setMp3Files([
      { name: 'Chapter 01.mp3', size: 5242880, duration: 300 },
      { name: 'Chapter 02.mp3', size: 4718592, duration: 270 },
      { name: 'Chapter 03.mp3', size: 6291456, duration: 360 }
    ]);
    setOriginalZipName('demo-audiobook.zip');
    setJobId('demo-job-123');
    setStepCompletions([true, false, false, false, false]);
    setCurrentStep(1); // Move to configure step
  }, []);

  // Start processing when leaving Preview
  const startProcessingFlow = useCallback(async () => {
    if (!jobId) return;
    try {
      setIsProcessing(true);
      setProcessingError('');
      setProgress(null);

      const unsub = audioProcessingAPI.subscribeToProgress(
        jobId,
        (p) => setProgress(p),
        () => {
          // processing completed successfully
          setIsProcessing(false);
          markStepComplete(2); // mark preview as completed
          setCurrentStep(3);   // go directly to download
        },
        (err) => {
          setProcessingError(err);
          setIsProcessing(false);
        }
      );
      setUnsubscribe(() => unsub);

      const config: ProcessingConfig = {
        whiteNoiseVolume,
      } as ProcessingConfig;

      await audioProcessingAPI.startProcessing(jobId, config);
    } catch (e) {
      setProcessingError('Failed to start processing');
      setIsProcessing(false);
    }
  }, [jobId, whiteNoiseVolume, markStepComplete]);

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 2) {
      // From Preview: trigger processing and do not advance until done
      if (!isProcessing) {
        void startProcessingFlow();
      }
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: return mp3Files.length > 0; // Upload complete
      case 1: return true; // Configure step (always can proceed)
      case 2: return !isProcessing; // Preview step - Next triggers processing
      case 3: return false; // Download step
      default: return false;
    }
  };

  // Memoize the steps array to prevent unnecessary re-renders
  const steps = useMemo(() => [
    {
      id: 'upload',
      title: 'Upload',
      description: 'Upload your ZIP file',
      component: (
        <div className="space-y-4">
          <UploadStep
            onFilesExtracted={handleFilesExtracted}
            onError={handleUploadError}
          />
          {!demoMode && mp3Files.length === 0 && (
            <div className="text-center">
              <button
                onClick={enableDemoMode}
                className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                🎭 Enable Demo Mode (Test UI)
              </button>
            </div>
          )}
        </div>
      ),
      isComplete: stepCompletions[0]
    },
    {
      id: 'configure',
      title: 'Configure',
      description: 'Set white noise volume',
      component: (
        <ConfigureStep
          volume={whiteNoiseVolume}
          onVolumeChange={handleVolumeChange}
          fileCount={mp3Files.length}
        />
      ),
      isComplete: stepCompletions[1]
    },
    {
      id: 'preview',
      title: 'Preview',
      description: 'Test your settings',
      component: (
        <PreviewStep
          mp3Files={mp3Files}
          whiteNoiseBlob={whiteNoiseBlob}
          whiteNoiseVolume={whiteNoiseVolume}
        />
      ),
      isComplete: stepCompletions[2],
      isOptional: true
    },
    {
      id: 'download',
      title: 'Download',
      description: 'Get your processed files',
      component: (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('DownloadStep error:', error, errorInfo);
          }}
        >
          <DownloadStep
            jobId={jobId}
            originalZipName={originalZipName}
            onStartOver={handleStartOver}
          />
        </ErrorBoundary>
      ),
      isComplete: stepCompletions[3]
    }
  ], [
    mp3Files,
    whiteNoiseBlob,
    whiteNoiseVolume,
    originalZipName,
    stepCompletions,
    handleFilesExtracted,
    handleUploadError,
    handleVolumeChange,
    handleStartOver
  ]);

  return (
    <div className="space-y-8 relative">
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 dark:bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border bg-white dark:bg-ice-gray-900 shadow-lg">
            <div className="text-center mb-4 font-medium">Processing audio…</div>
            <Progress value={progress?.totalProgress ?? 0} variant="audio" />
            {processingError && (
              <div className="mt-3 text-sm text-red-600">{processingError}</div>
            )}
          </div>
        </div>
      )}

      <StepWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onNext={handleNext}
        onPrevious={handlePrevious}
        nextDisabled={!canProceedToNext()}
        nextLabel={currentStep === 2 ? "Start Processing" : "Next"}
      />
    </div>
  );
};

export default FileUploader;
