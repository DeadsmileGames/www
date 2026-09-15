import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { lockBodyScroll } from '../../utils/dom';
import { safeImageUrl } from '../../utils/urls';
import './SearchOverlay.css';

export function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const { status, results, retry } = useSearch(query);

  useEffect(() => {
    if (!open) return;
    const unlock = lockBodyScroll();
    inputRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      unlock();
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
      <div className="search-overlay__bar container">
        <MagnifyingGlass weight="bold" size={22} aria-hidden="true"/>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Deadsmile Games…"
          className="search-overlay__input"
          aria-label="Search games"
          maxLength={80}
        />
        <button type="button" className="search-overlay__close" onClick={onClose} aria-label="Close search">
          <X weight="bold"/>
        </button>
      </div>

      <div className="search-overlay__results container">
        {status === 'idle' && <p className="search-overlay__hint">Start typing to find a game.</p>}

        {status === 'loading' && <p className="search-overlay__hint">Searching…</p>}

        {status === 'error' && <ErrorState title="SEARCH FAILED" message="We couldn't complete that search." onRetry={retry} />}

        {status === 'success' && results.length === 0 && (
          <EmptyState title="NO RESULTS" message={`Nothing matched "${query}".`} />
        )}

        {status === 'success' && results.length > 0 && (
          <ul className="search-overlay__list">
            {results.map((game) => (
              <li key={game.id}>
                <Link to={`/games/${game.slug}`} onClick={onClose} className="search-overlay__result">
                  <img
                    src={safeImageUrl(game.coverImage) || '/assets/placeholders/game-cover.svg'}
                    alt=""
                    className="search-overlay__thumb"
                  />
                  <div>
                    <p className="search-overlay__result-title">{game.title}</p>
                    <p className="search-overlay__result-desc">{game.shortDescription}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

