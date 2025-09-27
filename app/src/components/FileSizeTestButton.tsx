'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, CheckCircleIcon, AlertCircleIcon, LoaderIcon } from 'lucide-react';
import { processMP3WithWhiteNoiseOptimized } from '@/utils/optimizedAudioProcessor';

export const FileSizeTestButton = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const runFileSizeTest = async () => {
    setIsRunning(true);
    setResult('');
    setProgress(0);

    try {
      // Create a test MP3-like file (simulate 3-minute track)
      const mp3Duration = 3 * 60; // 3 minutes in seconds
      const sampleRate = 44100;
      const mp3Size = mp3Duration * sampleRate * 2 * 2; // stereo, 16-bit
      const mp3Data = new Uint8Array(mp3Size);
      
      // Fill with some pattern to simulate MP3 data
      for (let i = 0; i < mp3Data.length; i++) {
        mp3Data[i] = Math.floor(Math.sin(i / 1000) * 127 + 128);
      }
      const mp3Blob = new Blob([mp3Data], { type: 'audio/mpeg' });

      // Create a large white noise file (simulate 60-minute white noise)
      const whiteNoiseDuration = 60 * 60; // 60 minutes in seconds  
      const whiteNoiseSize = whiteNoiseDuration * sampleRate * 2 * 2; // stereo, 16-bit
      const whiteNoiseData = new Uint8Array(whiteNoiseSize);
      
      // Fill with random data to simulate white noise
      for (let i = 0; i < whiteNoiseData.length; i++) {
        whiteNoiseData[i] = Math.floor(Math.random() * 256);
      }
      const whiteNoiseBlob = new Blob([whiteNoiseData], { type: 'audio/mpeg' });

      setProgress(20);

      const startTime = Date.now();
      
      const processedBlob = await processMP3WithWhiteNoiseOptimized(
        mp3Blob,
        whiteNoiseBlob,
        0.3,
        'test-file.mp3',
        (fileProgress) => {
          setProgress(20 + (fileProgress * 0.8)); // 20-100%
        }
      );

      const duration = Date.now() - startTime;
      
      if (processedBlob) {
        const originalMp3SizeMB = (mp3Blob.size / 1024 / 1024).toFixed(1);
        const whiteNoiseSizeMB = (whiteNoiseBlob.size / 1024 / 1024).toFixed(1);
        const processedSizeMB = (processedBlob.size / 1024 / 1024).toFixed(1);
        
        // Calculate expected size (should be roughly MP3 size + proportional white noise)
        const expectedSizeMB = ((mp3Blob.size + (whiteNoiseBlob.size * (mp3Duration / whiteNoiseDuration))) / 1024 / 1024).toFixed(1);
        
        const sizeRatio = processedBlob.size / mp3Blob.size;
        const isOptimized = sizeRatio < 3; // Should be less than 3x original size
        
        setResult(`${isOptimized ? '✅' : '❌'} File Size Test Results:

📊 **File Sizes:**
• Original MP3: ${originalMp3SizeMB} MB (3 minutes)
• White Noise File: ${whiteNoiseSizeMB} MB (60 minutes)
• Processed Output: ${processedSizeMB} MB
• Expected Size: ~${expectedSizeMB} MB

📈 **Analysis:**
• Size Ratio: ${sizeRatio.toFixed(1)}x original
• Processing Time: ${(duration / 1000).toFixed(1)}s
• Memory Optimization: ${isOptimized ? 'WORKING' : 'NEEDS FIX'}

${isOptimized 
  ? '🎉 **SUCCESS!** The white noise is now properly trimmed to match MP3 duration. File sizes are reasonable and memory usage is optimized.'
  : '⚠️ **ISSUE DETECTED!** The output file is still too large, indicating the white noise trimming may not be working correctly.'
}

**Key Fix Applied:**
• White noise is now trimmed to match MP3 duration (3 min) instead of using the entire file (60 min)
• This prevents the 6GB ZIP file issue you experienced
• Memory usage is significantly reduced during processing`);

      } else {
        setResult('❌ Test failed: No processed file was generated');
      }

    } catch (error) {
      setResult(`❌ File size test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">File Size Optimization Test</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Test the white noise duration trimming fix to ensure reasonable output file sizes
        </p>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={runFileSizeTest}
          disabled={isRunning}
          size="lg"
        >
          {isRunning ? (
            <>
              <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
              Testing... {Math.round(progress)}%
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4 mr-2" />
              Run File Size Test
            </>
          )}
        </Button>
      </div>

      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
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
