import { useCallback, useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from './useAuth';

function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function useWishlist(gameId) {
  const { status: authStatus } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);

  const validGameId = useMemo(() => {
    if (!gameId || typeof gameId !== 'string') return null;
    return isValidUUID(gameId) ? gameId : null;
  }, [gameId]);

  const isAuthenticated = authStatus === 'authenticated';

  const check = useCallback(async () => {
    if (!validGameId || !isAuthenticated) {
      setInWishlist(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/wishlist/${validGameId}/check`);
      setInWishlist(res.inWishlist);
    } catch {
      setInWishlist(false);
    } finally {
      setLoading(false);
    }
  }, [validGameId, isAuthenticated]);

  const toggle = useCallback(async () => {
    if (!validGameId) {
      return false;
    }
    if (!isAuthenticated) {
      return false;
    }
    setLoading(true);
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${validGameId}`);
        setInWishlist(false);
      } else {
        await api.post('/wishlist', { gameId: validGameId });
        setInWishlist(true);
      }
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [validGameId, inWishlist, isAuthenticated]);

  useEffect(() => {
    if (authStatus === 'loading') return;
    check();
  }, [check, authStatus]);

  useEffect(() => {
    const onLive = (event) => {
      const detail = event.detail;
      if (detail?.event_type !== 'wishlist.updated' || detail?.payload?.gameId !== validGameId) return;
      setInWishlist(Boolean(detail.payload.inWishlist));
    };
    window.addEventListener('deadsmile:live', onLive);
    return () => window.removeEventListener('deadsmile:live', onLive);
  }, [validGameId]);

  return { inWishlist, loading, toggle };
}
