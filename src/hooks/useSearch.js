import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useDebounce } from './useDebounce';

export function useSearch(query, { page = 1, limit = 10 } = {}) {
  const debouncedQuery = useDebounce(query, 320);
  const [state, setState] = useState({ status: 'idle', results: [], pagination: null, error: null });
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const trimmed = debouncedQuery.trim().slice(0, 80);
    if (!trimmed) {
      setState({ status: 'idle', results: [], pagination: null, error: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading', error: null }));

    api
      .get('/search', { q: trimmed, page, limit })
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'success', results: data.items, pagination: data.pagination, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ status: 'error', results: [], pagination: null, error: err.message });
      });

    return () => { cancelled = true; };
  }, [debouncedQuery, page, limit, revision]);

  return { ...state, retry };
}
