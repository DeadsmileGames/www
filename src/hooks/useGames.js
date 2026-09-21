import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export function useGames({ page = 1, limit = 12, featured, genre, platform, status } = {}) {
  const [state, setState] = useState({ status: 'loading', games: [], pagination: null, error: null });
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading', error: null }));

    api
      .get('/games', { page, limit, featured, genre, platform, status })
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'success', games: data.items, pagination: data.pagination, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ status: 'error', games: [], pagination: null, error: err.message });
      });

    return () => { cancelled = true; };
  }, [page, limit, featured, genre, platform, status, revision]);

  useEffect(() => {
    const onLive = (event) => {
      if (event.detail?.event_type === 'game.published') retry();
    };
    window.addEventListener('deadsmile:live', onLive);
    return () => window.removeEventListener('deadsmile:live', onLive);
  }, [retry]);

  return { ...state, retry };
}
