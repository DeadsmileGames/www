import { useEffect, useRef } from 'react';
import { X, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { lockBodyScroll } from '../../utils/dom';
import { safeImageUrl } from '../../utils/urls';

export function Lightbox({ images, selectedIndex, onClose, onPrev, onNext }) {
  const closeRef = useRef(null);
  const open = selectedIndex !== null && images.length > 0;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const unlock = lockBodyScroll();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrev();
      if (event.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    closeRef.current?.focus();
    return () => {
      unlock();
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open, onClose, onPrev, onNext]);

  if (!open) return null;
  const image = safeImageUrl(images[selectedIndex]);
  if (!image) return null;

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label="Image viewer">
      <div className="lightbox__chrome" onClick={(event) => event.stopPropagation()}>
        <button ref={closeRef} type="button" className="lightbox__close" onClick={onClose} aria-label="Close image viewer">
          <X weight="bold" size={24} />
        </button>
        <div className="lightbox__stage">
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={onPrev} aria-label="Previous image">
            <CaretLeft weight="bold" size={28} />
          </button>
          <div className="lightbox__image-wrap">
            <img src={image} alt={`Image ${selectedIndex + 1}`} className="lightbox__image" />
          </div>
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={onNext} aria-label="Next image">
            <CaretRight weight="bold" size={28} />
          </button>
        </div>
        <div className="lightbox__footer">
          <span>Screenshot</span>
          <strong>{selectedIndex + 1} / {images.length}</strong>
        </div>
      </div>
    </div>
  );
}
