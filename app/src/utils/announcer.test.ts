import { describe, it, expect, beforeEach, vi } from 'vitest';
import { announce, announceUrgent, ANNOUNCER_REGION_IDS } from './announcer';

// Mirror the live regions that App.tsx renders.
function setupRegions() {
  document.body.innerHTML = `
    <div id="${ANNOUNCER_REGION_IDS.polite}" aria-live="polite"></div>
    <div id="${ANNOUNCER_REGION_IDS.assertive}" aria-live="assertive"></div>
  `;
}

const polite = () => document.getElementById(ANNOUNCER_REGION_IDS.polite);
const assertive = () => document.getElementById(ANNOUNCER_REGION_IDS.assertive);

describe('announce', () => {
  beforeEach(() => {
    setupRegions();
    // Make requestAnimationFrame synchronous for deterministic assertions.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  it('writes polite messages to the polite region by default', () => {
    announce('Step 2 of 4: Configure.');
    expect(polite()?.textContent).toBe('Step 2 of 4: Configure.');
    expect(assertive()?.textContent).toBe('');
  });

  it('writes assertive messages to the urgent region', () => {
    announce('Upload failed.', 'assertive');
    expect(assertive()?.textContent).toBe('Upload failed.');
    expect(polite()?.textContent).toBe('');
  });

  it('announceUrgent targets the assertive region', () => {
    announceUrgent('Processing failed.');
    expect(assertive()?.textContent).toBe('Processing failed.');
  });

  it('trims whitespace and ignores empty messages', () => {
    announce('   spaced   ');
    expect(polite()?.textContent).toBe('spaced');

    announce('   ');
    expect(polite()?.textContent).toBe('spaced');
  });

  it('clears the region before re-populating so repeats are re-announced', () => {
    const calls: string[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      // Capture the value at clear-time before the frame callback runs.
      calls.push(polite()?.textContent ?? '');
      cb(0);
      return 0;
    });

    announce('Same message');
    announce('Same message');
    // The region was cleared ('') before each re-population.
    expect(calls).toContain('');
    expect(polite()?.textContent).toBe('Same message');
  });

  it('does nothing when the target region is absent', () => {
    document.body.innerHTML = '';
    expect(() => announce('no region here')).not.toThrow();
  });
});
