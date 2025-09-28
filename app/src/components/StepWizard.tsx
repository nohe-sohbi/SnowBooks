'use client'

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
      {/* Winter Audio Studio Step Progress Indicator */}
      <div className="relative">
        {/* Background connecting line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-ice-gray-200 rounded-full" />

        {/* Gradient progress line */}
        <div
          className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-winter-blue-500 to-warm-amber-500 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 1.5rem)`,
            maxWidth: 'calc(100% - 3rem)'
          }}
        />

        <div className="flex items-center justify-between relative z-10">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep || step.isComplete;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep && !step.isComplete;

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-lg relative",
                    "hover:scale-105 cursor-pointer",
                    isCompleted && "bg-gradient-to-br from-winter-blue-500 to-winter-blue-600 border-winter-blue-500 shadow-winter-blue-500/25",
                    isCurrent && "bg-gradient-to-br from-warm-amber-500 to-warm-amber-600 border-warm-amber-500 shadow-warm-amber-500/25 animate-pulse-slow",
                    isPending && "bg-white border-ice-gray-300 shadow-ice-gray-200/50 hover:border-ice-gray-400"
                  )}
                >
                  {/* Glow effect for current step */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-warm-amber-400 opacity-20 animate-ping" />
                  )}

                  {getStepIcon(step.id, isCompleted, isCurrent)}
                </div>

                {/* Optional indicator */}
                {step.isOptional && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-ice-gray-400 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    ?
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Winter Audio Studio Step Labels */}
      <div className="flex items-start justify-between mt-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep || step.isComplete;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep && !step.isComplete;

          return (
            <div key={`${step.id}-label`} className="flex flex-col items-center text-center max-w-[140px] px-2">
              <h3
                className={cn(
                  "text-sm font-semibold transition-all duration-300 mb-1",
                  isCurrent && "text-warm-amber-700 font-bold",
                  isCompleted && "text-winter-blue-700",
                  isPending && "text-ice-gray-500"
                )}
              >
                {step.title}
                {step.isOptional && (
                  <span className="text-xs text-ice-gray-400 ml-1">(Optional)</span>
                )}
              </h3>
              <p
                className={cn(
                  "text-xs leading-relaxed transition-all duration-300",
                  isCurrent && "text-warm-amber-600",
                  isCompleted && "text-winter-blue-600",
                  isPending && "text-ice-gray-400"
                )}
              >
                {step.description}
              </p>

              {/* Progress indicator for current step */}
              {isCurrent && (
                <div className="mt-2 w-8 h-0.5 bg-gradient-to-r from-warm-amber-500 to-warm-amber-600 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Winter Audio Studio Current Step Content */}
      <div className="min-h-[400px] mt-8">
        <div className="space-y-8">
          {/* Step Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-winter-blue-50 to-warm-amber-50 rounded-full border border-winter-blue-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-warm-amber-500 to-warm-amber-600">
                {getStepIcon(currentStepData.id, false, true)}
              </div>
              <span className="text-sm font-medium text-winter-blue-700">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-display font-bold bg-gradient-to-r from-winter-blue-900 to-winter-blue-600 bg-clip-text text-transparent">
              {currentStepData.title}
            </h2>

            <p className="text-lg text-ice-gray-600 max-w-2xl mx-auto leading-relaxed">
              {currentStepData.description}
            </p>

            {currentStepData.isOptional && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-ice-gray-100 rounded-full text-sm text-ice-gray-600">
                <span className="w-2 h-2 bg-ice-gray-400 rounded-full"></span>
                This step is optional
              </div>
            )}
          </div>

          {/* Step Content */}
          <div className="max-w-5xl mx-auto">
            <div className="transition-all duration-300 animate-in slide-in-from-bottom-4">
              {currentStepData.component}
            </div>
          </div>
        </div>
      </div>

      {/* Winter Audio Studio Navigation */}
      {showNavigation && (
        <div className="mt-12 pt-8 border-t border-ice-gray-200">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={previousDisabled || isFirstStep}
              className={cn(
                "flex items-center gap-2 px-6 py-3 border-ice-gray-300 text-ice-gray-700 hover:border-winter-blue-300 hover:text-winter-blue-700 hover:bg-winter-blue-50 transition-all duration-200",
                (previousDisabled || isFirstStep) && "opacity-50 cursor-not-allowed"
              )}
            >
              <ChevronLeftIcon className="w-4 h-4" />
              {previousLabel}
            </Button>

            {/* Progress Indicator */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200",
                      index <= currentStep ? "bg-winter-blue-500" : "bg-ice-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-ice-gray-500 font-medium">
                {currentStep + 1} of {steps.length}
              </span>
            </div>

            {/* Next/Complete Button */}
            <Button
              onClick={onNext}
              disabled={nextDisabled}
              className={cn(
                "flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-winter-blue-500 to-winter-blue-600 hover:from-winter-blue-600 hover:to-winter-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105",
                nextDisabled && "opacity-50 cursor-not-allowed hover:scale-100",
                isLastStep && "from-warm-amber-500 to-warm-amber-600 hover:from-warm-amber-600 hover:to-warm-amber-700"
              )}
            >
              {isLastStep ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Complete
                </>
              ) : (
                <>
                  {nextLabel}
                  <ChevronRightIcon className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
