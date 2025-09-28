'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
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

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
            <AlertCircleIcon className="h-8 w-8" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Something went wrong</h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={this.handleReset}
            variant="outline"
            className="mt-4"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded border text-xs">
              <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
              <pre className="mt-2 whitespace-pre-wrap text-red-800 dark:text-red-200">
                {this.state.error.stack}
              </pre>
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
