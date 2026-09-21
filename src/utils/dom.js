let bodyLockCount = 0;
let previousOverflow = '';

export function lockBodyScroll() {
  if (typeof document === 'undefined') return () => {};
  if (bodyLockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyLockCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    bodyLockCount = Math.max(0, bodyLockCount - 1);
    if (bodyLockCount === 0) document.body.style.overflow = previousOverflow;
  };
}

export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');
