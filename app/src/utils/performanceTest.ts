// Performance testing utilities for memory optimization validation
import { globalMemoryManager } from './memoryManager';
import { createStreamingZip } from './streamingZipExporter';
import { processAllMP3FilesWithWhiteNoise } from './audioProcessor';

export interface PerformanceMetrics {
  startMemory: number;
  peakMemory: number;
  endMemory: number;
  duration: number;
  filesProcessed: number;
  averageFileSize: number;
  success: boolean;
  errors: string[];
}

export class PerformanceTest {
  private metrics: PerformanceMetrics = {
    startMemory: 0,
    peakMemory: 0,
    endMemory: 0,
    duration: 0,
    filesProcessed: 0,
    averageFileSize: 0,
    success: false,
    errors: []
  };

  private startTime: number = 0;
  private memoryMonitorInterval: NodeJS.Timeout | null = null;

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    this.startTime = Date.now();
    const initialMemory = globalMemoryManager.getMemoryInfo();
    this.metrics.startMemory = initialMemory?.used || 0;
    this.metrics.peakMemory = this.metrics.startMemory;

    // Monitor memory usage every second
    this.memoryMonitorInterval = setInterval(() => {
      const memoryInfo = globalMemoryManager.getMemoryInfo();
      if (memoryInfo && memoryInfo.used > this.metrics.peakMemory) {
        this.metrics.peakMemory = memoryInfo.used;
      }
    }, 1000);
  }

  /**
   * Stop monitoring and calculate final metrics
   */
  stopMonitoring(): PerformanceMetrics {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }

    this.metrics.duration = Date.now() - this.startTime;
    const finalMemory = globalMemoryManager.getMemoryInfo();
    this.metrics.endMemory = finalMemory?.used || 0;

    return { ...this.metrics };
  }

  /**
   * Add an error to the metrics
   */
  addError(error: string): void {
    this.metrics.errors.push(error);
    this.metrics.success = false;
  }

  /**
   * Mark test as successful
   */
  markSuccess(filesProcessed: number, averageFileSize: number): void {
    this.metrics.success = true;
    this.metrics.filesProcessed = filesProcessed;
    this.metrics.averageFileSize = averageFileSize;
  }
}

/**
 * Test audio processing performance
 */
export async function testAudioProcessingPerformance(
  testFiles: Array<{ name: string; blob: Blob }>,
  whiteNoiseBlob: Blob,
  whiteNoiseVolume: number = 0.3
): Promise<PerformanceMetrics> {
  const test = new PerformanceTest();
  test.startMonitoring();

  try {
    console.log(`Starting audio processing test with ${testFiles.length} files`);
    
    const processedFiles = await processAllMP3FilesWithWhiteNoise(
      testFiles,
      whiteNoiseBlob,
      whiteNoiseVolume,
      (fileIndex, fileProgress, totalProgress) => {
        if (fileProgress === 100) {
          console.log(`Processed file ${fileIndex + 1}/${testFiles.length} (${totalProgress}%)`);
        }
      }
    );

    const averageSize = testFiles.reduce((sum, file) => sum + file.blob.size, 0) / testFiles.length;
    test.markSuccess(processedFiles.length, averageSize);
    
    console.log(`Audio processing test completed successfully`);
    
  } catch (error) {
    console.error('Audio processing test failed:', error);
    test.addError(error instanceof Error ? error.message : String(error));
  }

  return test.stopMonitoring();
}

/**
 * Test ZIP creation performance
 */
export async function testZipCreationPerformance(
  testFiles: Array<{ name: string; blob: Blob }>,
  filename: string = 'test-performance.zip'
): Promise<PerformanceMetrics> {
  const test = new PerformanceTest();
  test.startMonitoring();

  try {
    console.log(`Starting ZIP creation test with ${testFiles.length} files`);
    
    await createStreamingZip(testFiles, filename, {
      onProgress: (progress, currentFile) => {
        if (progress % 10 === 0) { // Log every 10%
          console.log(`ZIP creation progress: ${progress}% ${currentFile ? `(${currentFile})` : ''}`);
        }
      },
      onMemoryWarning: (memoryUsage) => {
        console.warn(`Memory warning during ZIP creation: ${memoryUsage}MB`);
      }
    });

    const averageSize = testFiles.reduce((sum, file) => sum + file.blob.size, 0) / testFiles.length;
    test.markSuccess(testFiles.length, averageSize);
    
    console.log(`ZIP creation test completed successfully`);
    
  } catch (error) {
    console.error('ZIP creation test failed:', error);
    test.addError(error instanceof Error ? error.message : String(error));
  }

  return test.stopMonitoring();
}

/**
 * Generate test files for performance testing
 */
export function generateTestFiles(count: number, sizeKB: number = 1000): Array<{ name: string; blob: Blob }> {
  const testFiles: Array<{ name: string; blob: Blob }> = [];
  
  for (let i = 0; i < count; i++) {
    // Create a dummy blob of specified size
    const data = new Uint8Array(sizeKB * 1024);
    // Fill with some pattern to make it more realistic
    for (let j = 0; j < data.length; j++) {
      data[j] = (i + j) % 256;
    }
    
    const blob = new Blob([data], { type: 'audio/mpeg' });
    testFiles.push({
      name: `test-file-${i + 1}.mp3`,
      blob
    });
  }
  
  return testFiles;
}

/**
 * Run comprehensive performance test suite
 */
export async function runPerformanceTestSuite(): Promise<{
  audioProcessing: PerformanceMetrics;
  zipCreation: PerformanceMetrics;
  summary: {
    totalDuration: number;
    peakMemoryUsage: number;
    memoryEfficiency: number; // MB per file processed
    overallSuccess: boolean;
  };
}> {
  console.log('Starting comprehensive performance test suite...');
  
  // Generate test data
  const testFiles = generateTestFiles(10, 2000); // 10 files, 2MB each
  const whiteNoiseData = new Uint8Array(1024 * 100); // 100KB white noise
  const whiteNoiseBlob = new Blob([whiteNoiseData], { type: 'audio/mpeg' });
  
  // Test audio processing
  console.log('Testing audio processing performance...');
  const audioMetrics = await testAudioProcessingPerformance(testFiles, whiteNoiseBlob);
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test ZIP creation (using dummy processed files)
  console.log('Testing ZIP creation performance...');
  const zipMetrics = await testZipCreationPerformance(testFiles);
  
  // Calculate summary
  const summary = {
    totalDuration: audioMetrics.duration + zipMetrics.duration,
    peakMemoryUsage: Math.max(audioMetrics.peakMemory, zipMetrics.peakMemory),
    memoryEfficiency: Math.max(audioMetrics.peakMemory, zipMetrics.peakMemory) / testFiles.length,
    overallSuccess: audioMetrics.success && zipMetrics.success
  };
  
  console.log('Performance test suite completed');
  console.log('Summary:', summary);
  
  return {
    audioProcessing: audioMetrics,
    zipCreation: zipMetrics,
    summary
  };
}

/**
 * Validate memory optimization effectiveness
 */
export function validateMemoryOptimization(metrics: PerformanceMetrics): {
  isOptimized: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check memory efficiency (should be less than 50MB per file for optimized processing)
  const memoryPerFile = metrics.peakMemory / Math.max(metrics.filesProcessed, 1);
  if (memoryPerFile > 50) {
    issues.push(`High memory usage per file: ${memoryPerFile.toFixed(1)}MB`);
    recommendations.push('Consider implementing more aggressive chunking or streaming');
  }
  
  // Check memory cleanup (end memory should be close to start memory)
  const memoryLeak = metrics.endMemory - metrics.startMemory;
  if (memoryLeak > 20) {
    issues.push(`Potential memory leak detected: ${memoryLeak.toFixed(1)}MB not cleaned up`);
    recommendations.push('Improve cleanup procedures and garbage collection');
  }
  
  // Check processing efficiency (should process at least 1 file per 30 seconds)
  const processingRate = metrics.filesProcessed / (metrics.duration / 1000);
  if (processingRate < 1/30) {
    issues.push(`Slow processing rate: ${processingRate.toFixed(3)} files/second`);
    recommendations.push('Optimize audio processing algorithms or implement parallel processing');
  }
  
  return {
    isOptimized: issues.length === 0,
    issues,
    recommendations
  };
}
