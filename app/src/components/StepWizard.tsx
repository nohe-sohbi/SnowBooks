'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon, ChevronRightIcon, ChevronLeftIcon, Upload, Settings, Play, Zap, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  isComplete: boolean;
  isOptional?: boolean;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  nextDisabled?: boolean;
  previousDisabled?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  showNavigation?: boolean;
}

export const StepWizard = ({
  steps,
  currentStep,
  onNext,
  onPrevious,
  nextDisabled = false,
  previousDisabled = false,
  nextLabel = "Next",
  previousLabel = "Previous",
  showNavigation = true
}: StepWizardProps) => {
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Disabled announcements for cleaner UI
  // const announceStepChange = (stepIndex: number) => {
  //   const step = steps[stepIndex];
  //   const announcement = `Step ${stepIndex + 1} of ${steps.length}: ${step.title}. ${step.description}`;
  //   const announceElement = document.getElementById('announcements');
  //   if (announceElement) {
  //     announceElement.textContent = announcement;
  //   }
  // };

  // React.useEffect(() => {
  //   announceStepChange(currentStep);
  // }, [currentStep, steps]);

  // Winter Audio Theme Icons for each step
  const getStepIcon = (stepId: string, isCompleted: boolean, isCurrent: boolean) => {
    const iconProps = {
      className: cn(
        "w-5 h-5 transition-all duration-300",
        isCompleted || isCurrent ? "text-white" : "text-ice-gray-400"
      )
    };

    if (isCompleted) {
      return <CheckIcon {...iconProps} className={cn(iconProps.className, "animate-in zoom-in-50 duration-200")} />;
    }

    switch (stepId) {
      case 'upload':
        return <Upload {...iconProps} />;
      case 'configure':
        return <Settings {...iconProps} />;
      case 'preview':
        return <Play {...iconProps} />;
      case 'process':
        return <Zap {...iconProps} />;
      case 'download':
        return <Download {...iconProps} />;
      default:
        return <span className="text-sm font-medium text-white">{steps.findIndex(s => s.id === stepId) + 1}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Modern Clean Step Progress */}
      <nav className="relative mb-8" role="navigation" aria-label="Audio processing steps">
        {/* Progress indicator for screen readers */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Step {currentStep + 1} of {steps.length}: {currentStepData.title}
        </div>

        {/* Progress Bar */}
        <div className="relative">
          {/* Background track */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            {/* Progress fill */}
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="absolute top-0 left-0 right-0 flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep || step.isComplete;
              const isCurrent = index === currentStep;
              const isPending = index > currentStep && !step.isComplete;

              return (
                <div key={step.id} className="relative flex flex-col items-center">
                  {/* Step circle */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 -mt-3 bg-white",
                      isCompleted && "border-blue-500 bg-blue-500 text-white",
                      isCurrent && "border-blue-500 bg-white text-blue-600 ring-4 ring-blue-100",
                      isPending && "border-gray-300 text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>

                  {/* Step label */}
                  <div className="mt-3 text-center max-w-20">
                    <div
                      className={cn(
                        "text-xs font-medium transition-colors duration-300",
                        isCurrent && "text-blue-600",
                        isCompleted && "text-blue-600",
                        isPending && "text-gray-400"
                      )}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </nav>



      {/* Current Step Content */}
      <section className="min-h-[400px]" aria-labelledby="current-step-title">
        <div className="space-y-8">
          {/* Clean Step Header */}
          <div className="text-center space-y-4">
            <h3 id="current-step-title" className="text-3xl font-bold text-gray-900">
              {currentStepData.title}
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {currentStepData.description}
            </p>
          </div>

          {/* Step Content */}
          <div className="max-w-5xl mx-auto">
            {currentStepData.component}
          </div>
        </div>
      </section>

      {/* Navigation */}
      {showNavigation && (
        <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8">
          <Button
            onClick={onPrevious}
            disabled={previousDisabled || isFirstStep}
            variant="outline"
            size="sm"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            {previousLabel}
          </Button>

          <Button
            onClick={onNext}
            disabled={nextDisabled}
            size="sm"
          >
            {nextLabel}
            <ChevronRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};
