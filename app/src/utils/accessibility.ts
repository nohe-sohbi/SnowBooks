/**
 * SnowBooks Winter Audio Studio Accessibility Utilities
 * Provides helper functions for screen reader announcements and accessibility features
 */

/**
 * Announces a message to screen readers using ARIA live regions
 * @param message - The message to announce
 * @param priority - 'polite' for non-urgent announcements, 'assertive' for urgent ones
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const elementId = priority === 'assertive' ? 'urgent-announcements' : 'announcements';
  const element = document.getElementById(elementId);
  
  if (element) {
    // Clear previous announcement
    element.textContent = '';
    
    // Add new announcement after a brief delay to ensure it's read
    setTimeout(() => {
      element.textContent = message;
    }, 100);
    
    // Clear the announcement after it's been read
    setTimeout(() => {
      element.textContent = '';
    }, 5000);
  }
}

/**
 * Announces step changes in the audio processing workflow
 * @param stepIndex - Current step index (0-based)
 * @param stepTitle - Title of the current step
 * @param stepDescription - Description of the current step
 * @param totalSteps - Total number of steps
 */
export function announceStepChange(
  stepIndex: number,
  stepTitle: string,
  stepDescription: string,
  totalSteps: number
) {
  const message = `Step ${stepIndex + 1} of ${totalSteps}: ${stepTitle}. ${stepDescription}`;
  announceToScreenReader(message, 'polite');
}

/**
 * Announces volume changes for audio controls
 * @param volume - Volume level (0-1)
 * @param type - Type of audio (e.g., 'white noise', 'audiobook')
 */
export function announceVolumeChange(volume: number, type: string = 'white noise') {
  const percentage = Math.round(volume * 100);
  const message = `${type} volume set to ${percentage} percent`;
  announceToScreenReader(message, 'polite');
}

/**
 * Announces processing progress updates
 * @param progress - Progress percentage (0-100)
 * @param currentFile - Name of the current file being processed
 * @param totalFiles - Total number of files
 */
export function announceProcessingProgress(
  progress: number,
  currentFile?: string,
  totalFiles?: number
) {
  let message = `Processing ${Math.round(progress)} percent complete`;
  
  if (currentFile && totalFiles) {
    message += `. Currently processing ${currentFile}`;
  }
  
  // Only announce every 10% to avoid overwhelming screen readers
  if (progress % 10 === 0 || progress === 100) {
    announceToScreenReader(message, progress === 100 ? 'assertive' : 'polite');
  }
}

/**
 * Announces file upload status
 * @param fileCount - Number of files uploaded
 * @param totalSize - Total size of uploaded files (optional)
 */
export function announceFileUpload(fileCount: number, totalSize?: string) {
  let message = `${fileCount} file${fileCount !== 1 ? 's' : ''} uploaded successfully`;
  
  if (totalSize) {
    message += `. Total size: ${totalSize}`;
  }
  
  announceToScreenReader(message, 'assertive');
}

/**
 * Announces error messages with appropriate urgency
 * @param error - Error message
 * @param context - Context where the error occurred (optional)
 */
export function announceError(error: string, context?: string) {
  let message = 'Error: ' + error;
  
  if (context) {
    message = `Error in ${context}: ${error}`;
  }
  
  announceToScreenReader(message, 'assertive');
}

/**
 * Announces successful completion of tasks
 * @param task - The completed task
 * @param details - Additional details (optional)
 */
export function announceSuccess(task: string, details?: string) {
  let message = `${task} completed successfully`;
  
  if (details) {
    message += `. ${details}`;
  }
  
  announceToScreenReader(message, 'assertive');
}

/**
 * Checks if the user prefers reduced motion
 * @returns true if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Checks if the user is using a screen reader
 * @returns true if screen reader is likely being used
 */
export function isUsingScreenReader(): boolean {
  // Check for common screen reader indicators
  return (
    // Check for NVDA
    'speechSynthesis' in window ||
    // Check for JAWS or other screen readers that modify the DOM
    document.querySelector('[aria-live]') !== null ||
    // Check for reduced motion preference (often used by screen reader users)
    prefersReducedMotion()
  );
}

/**
 * Sets focus to an element with proper error handling
 * @param elementId - ID of the element to focus
 * @param delay - Optional delay before focusing (useful for dynamic content)
 */
export function focusElement(elementId: string, delay: number = 0) {
  const focusWithDelay = () => {
    const element = document.getElementById(elementId);
    if (element && typeof element.focus === 'function') {
      element.focus();
      
      // Announce focus change for screen readers
      const elementText = element.textContent || element.getAttribute('aria-label') || 'element';
      announceToScreenReader(`Focused on ${elementText}`, 'polite');
    }
  };
  
  if (delay > 0) {
    setTimeout(focusWithDelay, delay);
  } else {
    focusWithDelay();
  }
}

/**
 * Manages keyboard navigation for custom components
 * @param event - Keyboard event
 * @param handlers - Object mapping key names to handler functions
 */
export function handleKeyboardNavigation(
  event: KeyboardEvent,
  handlers: Record<string, () => void>
) {
  const handler = handlers[event.key];
  if (handler) {
    event.preventDefault();
    handler();
  }
}

/**
 * Validates color contrast ratio for accessibility compliance
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @returns contrast ratio
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  if (!fg || !bg) return 0;
  
  const fgLum = getLuminance(fg.r, fg.g, fg.b);
  const bgLum = getLuminance(bg.r, bg.g, bg.b);
  
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a color combination meets WCAG AA standards
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns true if the combination meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}
