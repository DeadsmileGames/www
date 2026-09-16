import { safeImageUrl } from '../../utils/urls';
import './GameGallery.css';

export function GameGallery({ images = [] }) {
  const safeImages = images.map(safeImageUrl).filter(Boolean);
  if (safeImages.length === 0) return null;

  return (
    <section className="game-gallery" aria-label="Screenshots">
      <h2 className="game-gallery__title">Gallery</h2>
      <div className="game-gallery__scroller">
        {safeImages.map((src, i) => (
          <img key={i} src={src} alt={`Screenshot ${i + 1}`} loading="lazy" />
        ))}
      </div>
    </section>
  );
}
