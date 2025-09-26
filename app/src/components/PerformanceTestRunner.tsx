'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, CheckCircleIcon, AlertCircleIcon, LoaderIcon } from 'lucide-react';
import { runPerformanceTestSuite, validateMemoryOptimization, type PerformanceMetrics } from '@/utils/performanceTest';

interface TestResults {
  audioProcessing: PerformanceMetrics;
  zipCreation: PerformanceMetrics;
  summary: {
    totalDuration: number;
    peakMemoryUsage: number;
    memoryEfficiency: number;
    overallSuccess: boolean;
  };
}

export const PerformanceTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [error, setError] = useState<string>('');

  const runTests = async () => {
    setIsRunning(true);
    setError('');
    setResults(null);

    try {
      const testResults = await runPerformanceTestSuite();
      setResults(testResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setIsRunning(false);
    }
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatMemory = (mb: number) => {
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Memory Optimization Performance Test</h2>
        <p className="text-muted-foreground">
          Test the effectiveness of memory optimizations for audio processing and ZIP creation
        </p>
      </div>

      {/* Test Controls */}
      <div className="flex justify-center">
        <Button
          onClick={runTests}
          disabled={isRunning}
          size="lg"
          className="min-w-[200px]"
        >
          {isRunning ? (
            <>
              <LoaderIcon className="h-5 w-5 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <PlayIcon className="h-5 w-5 mr-2" />
              Run Performance Tests
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircleIcon className="h-5 w-5" />
            <div>
              <p className="font-medium">Test Failed</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-6 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-3 mb-4">
              {results.summary.overallSuccess ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircleIcon className="h-6 w-6 text-red-500" />
              )}
              <h3 className="text-xl font-semibold">
                Test Results {results.summary.overallSuccess ? 'Passed' : 'Failed'}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{formatDuration(results.summary.totalDuration)}</p>
                <p className="text-sm text-muted-foreground">Total Duration</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{formatMemory(results.summary.peakMemoryUsage)}</p>
                <p className="text-sm text-muted-foreground">Peak Memory</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{formatMemory(results.summary.memoryEfficiency)}</p>
                <p className="text-sm text-muted-foreground">Memory/File</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {results.audioProcessing.filesProcessed + results.zipCreation.filesProcessed}
                </p>
                <p className="text-sm text-muted-foreground">Files Processed</p>
              </div>
            </div>
          </div>

          {/* Audio Processing Results */}
          <div className="p-6 border rounded-lg">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {results.audioProcessing.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircleIcon className="h-5 w-5 text-red-500" />
              )}
              Audio Processing Test
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="font-medium">{formatDuration(results.audioProcessing.duration)}</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
              <div>
                <p className="font-medium">{formatMemory(results.audioProcessing.peakMemory)}</p>
                <p className="text-sm text-muted-foreground">Peak Memory</p>
              </div>
              <div>
                <p className="font-medium">{results.audioProcessing.filesProcessed}</p>
                <p className="text-sm text-muted-foreground">Files Processed</p>
              </div>
              <div>
                <p className="font-medium">{formatMemory(results.audioProcessing.averageFileSize / (1024 * 1024))}</p>
                <p className="text-sm text-muted-foreground">Avg File Size</p>
              </div>
            </div>

            {results.audioProcessing.errors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Errors:</p>
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {results.audioProcessing.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ZIP Creation Results */}
          <div className="p-6 border rounded-lg">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {results.zipCreation.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircleIcon className="h-5 w-5 text-red-500" />
              )}
              ZIP Creation Test
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="font-medium">{formatDuration(results.zipCreation.duration)}</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
              <div>
                <p className="font-medium">{formatMemory(results.zipCreation.peakMemory)}</p>
                <p className="text-sm text-muted-foreground">Peak Memory</p>
              </div>
              <div>
                <p className="font-medium">{results.zipCreation.filesProcessed}</p>
                <p className="text-sm text-muted-foreground">Files Processed</p>
              </div>
              <div>
                <p className="font-medium">{formatMemory(results.zipCreation.averageFileSize / (1024 * 1024))}</p>
                <p className="text-sm text-muted-foreground">Avg File Size</p>
              </div>
            </div>

            {results.zipCreation.errors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Errors:</p>
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {results.zipCreation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Optimization Analysis */}
          {results.audioProcessing.success && (
            <div className="p-6 border rounded-lg">
              <h4 className="text-lg font-semibold mb-4">Memory Optimization Analysis</h4>
              {[results.audioProcessing, results.zipCreation].map((metrics, index) => {
                const analysis = validateMemoryOptimization(metrics);
                const testName = index === 0 ? 'Audio Processing' : 'ZIP Creation';
                
                return (
                  <div key={index} className="mb-4 last:mb-0">
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      {analysis.isOptimized ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircleIcon className="h-4 w-4 text-yellow-500" />
                      )}
                      {testName} - {analysis.isOptimized ? 'Optimized' : 'Needs Improvement'}
                    </h5>
                    
                    {analysis.issues.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Issues:</p>
                        <ul className="text-sm text-yellow-600 dark:text-yellow-400 ml-4">
                          {analysis.issues.map((issue, i) => (
                            <li key={i}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Recommendations:</p>
                        <ul className="text-sm text-blue-600 dark:text-blue-400 ml-4">
                          {analysis.recommendations.map((rec, i) => (
                            <li key={i}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
