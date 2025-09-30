import { test, expect } from '@playwright/test';
import path from 'path';
import os from 'os';

/**
 * End-to-end test for FFmpeg audio processing with special characters
 * 
 * This test reproduces and verifies the fix for FFmpeg exit code 234
 * when processing files with special characters like "00 - Précédemment.mp3"
 * 
 * Root cause: Sample rate mismatch between main audio (44100 Hz) and white noise (48000 Hz)
 * Solution: Added explicit aresample filter to ensure both streams are at same sample rate
 */

test.describe('FFmpeg Audio Processing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    await expect(page.locator('h1')).toContainText('Mix white noise with audio');
  });

  test('should successfully process file with special characters', async ({ page }) => {
    // Expand the test file path
    const testFilePath = path.join(os.homedir(), 'Téléchargements', 'testtest.zip');
    
    console.log(`📁 Test file path: ${testFilePath}`);

    // Step 1: Upload the ZIP file
    console.log('📤 Step 1: Uploading ZIP file...');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Wait for upload to complete
    await expect(page.locator('text=Upload Complete')).toBeVisible({ timeout: 30000 });
    console.log('✅ Upload complete');

    // Verify files are listed
    await expect(page.locator('text=00 - Précédemment.mp3')).toBeVisible();
    console.log('✅ File with special characters detected');

    // Step 2: Navigate to Configure step
    console.log('⚙️  Step 2: Configuring settings...');
    await page.locator('button:has-text("Next")').click();
    
    // Wait for Configure step
    await expect(page.locator('text=Configure Processing')).toBeVisible();

    // Select M4B format
    await page.locator('button:has-text("M4B")').click();
    console.log('✅ M4B format selected');

    // Set white noise volume to 100%
    const volumeSlider = page.locator('input[type="range"]');
    await volumeSlider.fill('100');
    console.log('✅ White noise volume set to 100%');

    // Step 3: Navigate to Preview step
    console.log('👁️  Step 3: Previewing...');
    await page.locator('button:has-text("Next")').click();
    
    // Wait for Preview step
    await expect(page.locator('text=Preview')).toBeVisible({ timeout: 30000 });
    console.log('✅ Preview step loaded');

    // Verify M4B format notice is shown
    await expect(page.locator('text=M4B Audiobook Format Selected')).toBeVisible();
    console.log('✅ M4B format notice displayed');

    // Step 4: Start processing
    console.log('🔄 Step 4: Starting processing...');
    await page.locator('button:has-text("Start Processing")').click();

    // Wait for processing to complete or fail
    // This is the critical test - it should NOT show "Processing Error"
    console.log('⏳ Waiting for processing to complete...');
    
    // Wait up to 5 minutes for processing
    const processingTimeout = 300000; // 5 minutes

    try {
      // Check if processing completes successfully
      await expect(page.locator('text=Processing Complete')).toBeVisible({ 
        timeout: processingTimeout 
      });
      console.log('✅ Processing completed successfully!');

      // Verify download button is available
      await expect(page.locator('button:has-text("Download")')).toBeVisible();
      console.log('✅ Download button available');

      // Take success screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/processing-success.png',
        fullPage: true 
      });
      console.log('📸 Success screenshot saved');

    } catch (error) {
      // If processing fails, capture error details
      console.error('❌ Processing failed!');

      // Check for error message
      const errorElement = page.locator('text=Processing Error');
      if (await errorElement.isVisible()) {
        const errorText = await page.locator('.text-red-600').textContent();
        console.error(`Error message: ${errorText}`);
      }

      // Take failure screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/processing-failure.png',
        fullPage: true 
      });
      console.log('📸 Failure screenshot saved');

      // Re-throw the error to fail the test
      throw error;
    }
  });

  test('should handle sample rate mismatch correctly', async ({ page }) => {
    /**
     * This test verifies that the FFmpeg command includes proper sample rate handling
     * by checking the backend logs (if accessible) or by ensuring processing succeeds
     */
    
    const testFilePath = path.join(os.homedir(), 'Téléchargements', 'testtest.zip');
    
    // Upload and configure
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    await expect(page.locator('text=Upload Complete')).toBeVisible({ timeout: 30000 });
    
    // Navigate through steps
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=Configure Processing')).toBeVisible();
    
    // Select MP3 format (simpler than M4B)
    await page.locator('button:has-text("MP3")').click();
    
    // Set volume
    await page.locator('input[type="range"]').fill('50');
    
    // Go to preview
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=Preview')).toBeVisible({ timeout: 30000 });
    
    // Start processing
    await page.locator('button:has-text("Start Processing")').click();
    
    // Verify processing completes
    await expect(page.locator('text=Processing Complete')).toBeVisible({ 
      timeout: 300000 
    });
    
    console.log('✅ Sample rate mismatch handled correctly');
  });

  test('should show progress updates during processing', async ({ page }) => {
    const testFilePath = path.join(os.homedir(), 'Téléchargements', 'testtest.zip');
    
    // Upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    await expect(page.locator('text=Upload Complete')).toBeVisible({ timeout: 30000 });
    
    // Configure
    await page.locator('button:has-text("Next")').click();
    await page.locator('button:has-text("MP3")').click();
    
    // Preview
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=Preview')).toBeVisible({ timeout: 30000 });
    
    // Start processing
    await page.locator('button:has-text("Start Processing")').click();
    
    // Verify progress indicator appears
    await expect(page.locator('text=Processing')).toBeVisible({ timeout: 5000 });
    console.log('✅ Progress indicator shown');
    
    // Wait for completion
    await expect(page.locator('text=Processing Complete')).toBeVisible({ 
      timeout: 300000 
    });
  });
});

