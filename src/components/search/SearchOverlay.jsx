import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { safeImageUrl } from '../../utils/urls';

export function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('games');
  const inputRef = useRef(null);
  const { status, results, retry } = useSearch(query);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);


useEffect(() => {
  if (!open) return;

  function handleClickOutside(event) {
    const search = document.querySelector('.search-overlay');

    if (search && !search.contains(event.target)) {
      onClose();
    }
  }

  document.addEventListener('mousedown', handleClickOutside);

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [open, onClose]);


  if (!open) return null;

  return (
    <div className="search-overlay" role="search" aria-label="Site search">
      <div className="search-overlay__inner">
        <div className="search-overlay__bar">
          <MagnifyingGlass weight="bold" size={24} aria-hidden="true"/>
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
        </div>
        <div className="search-overlay__filters" aria-label="Search type">
        </div>
        <button type="button" className="search-overlay__close" onClick={onClose} aria-label="Close search">
          <X weight="bold"/>
        </button>
      </div>

      <div className="search-overlay__results">
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
