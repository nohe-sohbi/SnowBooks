'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import { useAnnouncer } from '@/hooks/useAnnouncer';
import { formatTimeRemaining } from '@/utils/formatters';

// Human-readable labels for each wizard step, used for screen-reader
// announcements when the active step changes.
const STEP_LABELS = ['Upload', 'Configure', 'Preview', 'Download'] as const;


const FileUploader = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [mp3Files, setMp3Files] = useState<MP3File[]>([]);
  const [whiteNoiseVolume, setWhiteNoiseVolume] = useState(0.3);
  const [whiteNoiseBlob, setWhiteNoiseBlob] = useState<Blob | null>(null);

  const [originalZipName, setOriginalZipName] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [stepCompletions, setStepCompletions] = useState<boolean[]>([false, false, false, false]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string>('');
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const announce = useAnnouncer();
  // Tracks the last file index we announced so we don't repeat announcements
  // on every progress tick (only when the current file actually changes).
  const lastAnnouncedFileRef = useRef<number>(-1);

  // Announce the active step to assistive technology whenever it changes.
  useEffect(() => {
    const label = STEP_LABELS[currentStep];
    if (label) {
      announce(`Step ${currentStep + 1} of ${STEP_LABELS.length}: ${label}.`);
    }
  }, [currentStep, announce]);

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
  const markStepComplete = useCallback((stepIndex: number) => {
    setStepCompletions(prev => {
      const newCompletions = [...prev];
      newCompletions[stepIndex] = true;
      return newCompletions;
    });
  }, []);

  // Memoized step event handlers to prevent unnecessary re-renders
  const handleFilesExtracted = useCallback((files: MP3File[], zipName: string, uploadJobId: string) => {
    setMp3Files(files);
    setOriginalZipName(zipName);
    setJobId(uploadJobId);
    markStepComplete(0);
    announce(`${files.length} audio ${files.length === 1 ? 'file' : 'files'} extracted from ${zipName}.`);
    setCurrentStep(1); // Move to configure step
  }, [announce, markStepComplete]);

  const handleUploadError = useCallback((error: string) => {
    console.error('Upload error:', error);
    announce(`Upload failed: ${error}`, 'assertive');
  }, [announce]);

  const handleVolumeChange = useCallback((volume: number) => {
    setWhiteNoiseVolume(volume);
    markStepComplete(1); // Mark configure step as complete when volume is set
  }, [markStepComplete]);



  const handleStartOver = useCallback(() => {
    setCurrentStep(0);
    setMp3Files([]);

    setOriginalZipName('');
    setStepCompletions([false, false, false, false]);
    if (unsubscribe) {
      unsubscribe();
    }
    setUnsubscribe(null);
    setIsProcessing(false);
    setProcessingError('');
    setProgress(null);
    lastAnnouncedFileRef.current = -1;
  }, [unsubscribe]);

  // Cancel an in-flight processing job and return the user to an idle state.
  const handleCancelProcessing = useCallback(async () => {
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
    try {
      if (jobId) {
        await audioProcessingAPI.cancelJob(jobId);
      }
    } catch (e) {
      // We are tearing the job down regardless; a failed cancel call is non-fatal.
      console.warn('Cancel request failed:', e);
    }
    setIsProcessing(false);
    setProgress(null);
    lastAnnouncedFileRef.current = -1;
    announce('Processing cancelled.');
  }, [unsubscribe, jobId, announce]);



  // Start processing when leaving Preview
  const startProcessingFlow = useCallback(async () => {
    if (!jobId) return;
    try {
      setIsProcessing(true);
      setProcessingError('');
      setProgress(null);
      lastAnnouncedFileRef.current = -1;
      announce('Processing started.');

      const unsub = audioProcessingAPI.subscribeToProgress(
        jobId,
        (p) => {
          setProgress(p);
          // Announce only when the file being processed changes, to avoid
          // flooding screen-reader users with every progress tick.
          if (p.currentFileName && p.currentFileIndex !== lastAnnouncedFileRef.current) {
            lastAnnouncedFileRef.current = p.currentFileIndex;
            announce(`Processing file ${p.currentFileIndex + 1} of ${p.totalFiles}: ${p.currentFileName}.`);
          }
        },
        () => {
          // processing completed successfully
          setIsProcessing(false);
          announce('Processing complete. Your collection is ready to download.', 'assertive');
          markStepComplete(2); // mark preview as completed
          setCurrentStep(3);   // go directly to download
        },
        (err) => {
          setProcessingError(err);
          setIsProcessing(false);
          announce(`Processing failed: ${err}`, 'assertive');
        }
      );
      setUnsubscribe(() => unsub);

      const config: ProcessingConfig = {
        whiteNoiseVolume,
      } as ProcessingConfig;

      await audioProcessingAPI.startProcessing(jobId, config);
    } catch {
      setProcessingError('Failed to start processing');
      setIsProcessing(false);
      announce('Failed to start processing.', 'assertive');
    }
  }, [jobId, whiteNoiseVolume, markStepComplete, announce]);

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
        <UploadStep
          onFilesExtracted={handleFilesExtracted}
          onError={handleUploadError}
        />
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
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 dark:bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Audio processing in progress"
        >
          <div className="w-full max-w-md p-6 rounded-xl border bg-white dark:bg-ice-gray-900 shadow-lg">
            <div className="text-center mb-1 font-medium">Processing audio…</div>

            {/* Current file being processed */}
            {progress?.currentFileName ? (
              <div className="mb-4 text-center text-sm text-ice-gray-600 dark:text-ice-gray-400">
                <span className="block truncate" title={progress.currentFileName}>
                  {progress.currentFileName}
                </span>
                <span className="tabular-nums">
                  File {Math.min(progress.currentFileIndex + 1, progress.totalFiles)} of {progress.totalFiles}
                </span>
              </div>
            ) : (
              <div className="mb-4 text-center text-sm text-ice-gray-600 dark:text-ice-gray-400">
                Preparing your files…
              </div>
            )}

            <Progress value={progress?.totalProgress ?? 0} variant="audio" />

            {/* Percent + estimated time remaining */}
            <div className="mt-2 flex items-center justify-between text-xs text-ice-gray-500 dark:text-ice-gray-400">
              <span className="tabular-nums">{Math.round(progress?.totalProgress ?? 0)}%</span>
              {formatTimeRemaining(progress?.estimatedTimeRemaining) && (
                <span className="tabular-nums">
                  ~{formatTimeRemaining(progress?.estimatedTimeRemaining)} remaining
                </span>
              )}
            </div>

            {processingError && (
              <div className="mt-3 text-sm text-red-600" role="alert">{processingError}</div>
            )}

            <div className="mt-5 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { void handleCancelProcessing(); }}
              >
                Cancel processing
              </Button>
            </div>
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
