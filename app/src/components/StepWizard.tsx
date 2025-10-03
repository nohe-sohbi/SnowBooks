'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRightIcon, ChevronLeftIcon } from 'lucide-react';

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
  const isFirstStep = currentStep === 0;

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
