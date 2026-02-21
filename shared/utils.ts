// Shared utility functions

/**
 * Detects if the current device is mobile (has touch support)
 */
export function isMobile(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
