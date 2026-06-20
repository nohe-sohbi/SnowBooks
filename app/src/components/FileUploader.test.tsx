import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import FileUploader from './FileUploader';
import { ANNOUNCER_REGION_IDS } from '@/utils/announcer';

// Render the component alongside the same ARIA live regions that App.tsx
// provides, so the announcer has somewhere to write.
function renderWithLiveRegions() {
  return render(
    <>
      <div id={ANNOUNCER_REGION_IDS.polite} aria-live="polite" />
      <div id={ANNOUNCER_REGION_IDS.assertive} aria-live="assertive" />
      <FileUploader />
    </>,
  );
}

describe('FileUploader accessibility wiring', () => {
  beforeEach(() => {
    // White-noise fetch is irrelevant to this test; keep it from hitting the network.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: async () => new Blob() }));
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  it('announces the initial wizard step to screen readers', async () => {
    renderWithLiveRegions();

    await waitFor(() => {
      expect(document.getElementById(ANNOUNCER_REGION_IDS.polite)?.textContent).toBe(
        'Step 1 of 4: Upload.',
      );
    });
  });
});
