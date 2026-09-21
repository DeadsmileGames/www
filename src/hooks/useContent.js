import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

export function useContent(path, params = {}) {
  const requestId = useRef(0);
  const paramsKey = JSON.stringify(params);
  const [state, setState] = useState({ status: path ? 'loading' : 'idle', data: path ? [] : null, error: '' });

  const load = useCallback(async () => {
    if (!path) {
      requestId.current += 1;
      setState({ status: 'idle', data: null, error: '' });
      return null;
    }
    const id = ++requestId.current;
    setState((current) => ({ ...current, status: 'loading', error: '' }));
    try {
      const data = await api.get(path, JSON.parse(paramsKey));
      if (id === requestId.current) setState({ status: 'success', data: data ?? [], error: '' });
      return data;
    } catch (error) {
      if (id === requestId.current) {
        setState({ status: 'error', data: [], error: error?.message || 'Unable to load content.' });
      }
      return null;
    }
  }, [path, paramsKey]);

  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  useEffect(() => {
    if (!path) return undefined;
    const onLive = (event) => {
      const type = event.detail?.event_type || '';
      if ((path.startsWith('/news') && type === 'news.published') || (path.startsWith('/videos') && type === 'video.published')) load();
    };
    window.addEventListener('deadsmile:live', onLive);
    return () => window.removeEventListener('deadsmile:live', onLive);
  }, [path, load]);

  return { ...state, retry: load };
}
