'use client'

import { Button } from '@/components/ui/button';
import { CheckIcon, ChevronRightIcon, ChevronLeftIcon } from 'lucide-react';
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

  return (
    <div className="space-y-8">
      {/* Step Progress Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                index < currentStep || step.isComplete
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStep
                  ? "border-primary text-primary bg-background"
                  : "border-muted-foreground/30 text-muted-foreground bg-background"
              )}
            >
              {index < currentStep || step.isComplete ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-16 mx-2 transition-all duration-200",
                  index < currentStep
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={`${step.id}-label`} className="flex flex-col items-center text-center max-w-[120px]">
            <h3
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                index === currentStep
                  ? "text-foreground"
                  : index < currentStep || step.isComplete
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {step.title}
            </h3>
            <p
              className={cn(
                "text-xs mt-1 transition-colors duration-200",
                index === currentStep
                  ? "text-muted-foreground"
                  : "text-muted-foreground/60"
              )}
            >
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <div className="min-h-[400px]">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
            <p className="text-muted-foreground">{currentStepData.description}</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {currentStepData.component}
          </div>
        </div>
      </div>

      {/* Navigation */}
      {showNavigation && (
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={previousDisabled || isFirstStep}
            className="flex items-center gap-2"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            {previousLabel}
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>

          <Button
            onClick={onNext}
            disabled={nextDisabled}
            className="flex items-center gap-2"
          >
            {isLastStep ? "Complete" : nextLabel}
            {!isLastStep && <ChevronRightIcon className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};
