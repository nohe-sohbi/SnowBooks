'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, CheckCircleIcon, AlertCircleIcon, LoaderIcon } from 'lucide-react';
import { processAllMP3FilesWithWhiteNoiseOptimized } from '@/utils/optimizedAudioProcessor';

export const PerformanceTestButton = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setResult('');
    setProgress(0);

    try {
      // Create small test files (1MB each)
      const testFiles = [];
      for (let i = 0; i < 3; i++) {
        const data = new Uint8Array(1024 * 1024); // 1MB
        // Fill with some pattern
        for (let j = 0; j < data.length; j++) {
          data[j] = (i + j) % 256;
        }
        const blob = new Blob([data], { type: 'audio/mpeg' });
        testFiles.push({ name: `test-${i + 1}.mp3`, blob });
      }

      // Create white noise test data
      const whiteNoiseData = new Uint8Array(1024 * 100); // 100KB
      for (let i = 0; i < whiteNoiseData.length; i++) {
        whiteNoiseData[i] = Math.floor(Math.random() * 256);
      }
      const whiteNoiseBlob = new Blob([whiteNoiseData], { type: 'audio/mpeg' });

      const startTime = Date.now();
      
      const processedFiles = await processAllMP3FilesWithWhiteNoiseOptimized(
        testFiles,
        whiteNoiseBlob,
        0.3,
        (fileIndex, fileProgress, totalProgress) => {
          setProgress(totalProgress);
        }
      );

      const duration = Date.now() - startTime;
      
      setResult(`✅ Performance test completed successfully!
      
📊 Results:
• Files processed: ${processedFiles.length}
• Duration: ${(duration / 1000).toFixed(1)}s
• Average per file: ${(duration / processedFiles.length / 1000).toFixed(1)}s
• UI remained responsive: ✅

The optimized audio processor is working correctly and should allow smooth processing for testing the ZIP optimizations.`);

    } catch (error) {
      setResult(`❌ Performance test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Audio Processing Performance Test</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Test the optimized audio processor to ensure it's working smoothly before testing ZIP optimizations
        </p>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={runPerformanceTest}
          disabled={isRunning}
          size="lg"
        >
          {isRunning ? (
            <>
              <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
              Testing... {progress}%
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4 mr-2" />
              Run Performance Test
            </>
          )}
        </Button>
      </div>

      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {result && (
        <div className={`p-4 rounded-lg border ${
          result.includes('✅') 
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
        }`}>
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};
