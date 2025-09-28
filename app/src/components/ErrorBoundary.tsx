'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/alert';
import { AlertCircleIcon, RefreshCwIcon, Bug, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  title?: string;
  description?: string;
  showRetry?: boolean;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const {
        title = "Something went wrong",
        description,
        showRetry = true,
        showDetails = process.env.NODE_ENV === 'development'
      } = this.props;

      const errorMessage = description || this.state.error?.message || 'An unexpected error occurred';
      const isAudioError = this.state.error?.message?.toLowerCase().includes('audio') ||
                          this.state.error?.message?.toLowerCase().includes('processing');

      // Winter Audio Studio themed error UI
      return (
        <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
          {/* Main Error Alert */}
          <ErrorAlert
            title={title}
            retry={showRetry ? this.handleReset : undefined}
            className="border-l-4 border-l-red-500"
          >
            {errorMessage}
          </ErrorAlert>

          {/* Audio-specific error guidance */}
          {isAudioError && (
            <div className="bg-gradient-to-r from-winter-blue-50 to-ice-gray-50 dark:from-winter-blue-950 dark:to-ice-gray-950 border border-winter-blue-200 dark:border-winter-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-winter-blue-600 dark:text-winter-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                    Audio Processing Tips
                  </h4>
                  <ul className="text-sm text-winter-blue-700 dark:text-winter-blue-300 space-y-1">
                    <li>• Ensure your audio files are in MP3 format</li>
                    <li>• Try processing fewer files at once</li>
                    <li>• Check that your ZIP file contains valid audio files</li>
                    <li>• Close other browser tabs to free up memory</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && (
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Try Again
              </Button>
            )}

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Reload Page
            </Button>
          </div>

          {/* Development Error Details */}
          {showDetails && this.state.error && (
            <details className="mt-6 p-4 bg-gradient-to-r from-ice-gray-100 to-ice-gray-50 dark:from-ice-gray-900 dark:to-ice-gray-800 rounded-lg border border-ice-gray-200 dark:border-ice-gray-700">
              <summary className="cursor-pointer font-medium text-ice-gray-900 dark:text-ice-gray-100 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Error Details (Development)
              </summary>
              <div className="mt-3 space-y-2">
                <div className="text-sm">
                  <strong className="text-ice-gray-900 dark:text-ice-gray-100">Error:</strong>
                  <span className="ml-2 text-red-600 dark:text-red-400">{this.state.error.name}</span>
                </div>
                <div className="text-sm">
                  <strong className="text-ice-gray-900 dark:text-ice-gray-100">Message:</strong>
                  <span className="ml-2 text-ice-gray-700 dark:text-ice-gray-300">{this.state.error.message}</span>
                </div>
                {this.state.error.stack && (
                  <div className="text-xs">
                    <strong className="text-ice-gray-900 dark:text-ice-gray-100">Stack Trace:</strong>
                    <pre className="mt-1 p-2 bg-ice-gray-200 dark:bg-ice-gray-800 rounded text-ice-gray-800 dark:text-ice-gray-200 overflow-x-auto whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
