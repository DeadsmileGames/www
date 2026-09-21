import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FOCUSABLE_SELECTOR, lockBodyScroll } from '../../utils/dom';

export function Modal({ open, onClose, children, labelledBy }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const unlock = lockBodyScroll();
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR)].filter((node) => node instanceof HTMLElement && !node.hasAttribute('hidden'));
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => {
      unlock();
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} ref={panelRef}>
        {children}
      </div>
    </div>,
    document.body
  );
}
