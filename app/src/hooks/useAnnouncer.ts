import { useCallback } from 'react';
import { announce, type AnnouncementUrgency } from '@/utils/announcer';

/**
 * React hook exposing a stable `announce` callback for screen-reader updates.
 *
 * Returns a memoised function so it can be used safely in effect/callback
 * dependency arrays without triggering re-renders.
 */
export function useAnnouncer() {
  return useCallback(
    (message: string, urgency: AnnouncementUrgency = 'polite') => {
      announce(message, urgency);
    },
    [],
  );
}
