// Screen-reader announcements.
//
// `App.tsx` renders two visually-hidden ARIA live regions:
//   • #announcements        (aria-live="polite")    — status updates
//   • #urgent-announcements (aria-live="assertive")  — errors / urgent info
//
// These regions existed but nothing ever wrote to them, so the app was silent
// to assistive technology. This module is the single place that updates them.

export type AnnouncementUrgency = 'polite' | 'assertive';

export const ANNOUNCER_REGION_IDS: Record<AnnouncementUrgency, string> = {
  polite: 'announcements',
  assertive: 'urgent-announcements',
};

const scheduleFrame = (cb: () => void): void => {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(cb);
  } else {
    setTimeout(cb, 0);
  }
};

/**
 * Announce a message to assistive technology via the relevant live region.
 *
 * The region is cleared first and re-populated on the next frame so that
 * repeated identical messages are still re-announced by screen readers
 * (which otherwise ignore an unchanged text node).
 */
export function announce(
  message: string,
  urgency: AnnouncementUrgency = 'polite',
): void {
  if (typeof document === 'undefined') return;
  const trimmed = message?.trim();
  if (!trimmed) return;

  const region = document.getElementById(ANNOUNCER_REGION_IDS[urgency]);
  if (!region) return;

  region.textContent = '';
  scheduleFrame(() => {
    region.textContent = trimmed;
  });
}

/** Convenience wrapper for assertive (interrupting) announcements. */
export function announceUrgent(message: string): void {
  announce(message, 'assertive');
}
