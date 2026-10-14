import { useCallback, useEffect, useRef, useState } from "react";
import { api, friendlyErrorMessage } from "../services/api";
import { useAuth } from "./useAuth";

export function useWishlist(gameId) {
  const { status: authStatus, user } = useAuth();
  const validGameId =
    typeof gameId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      gameId,
    )
      ? gameId
      : null;
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const busy = useRef(false);
  const authenticated = authStatus === "authenticated";
  const check = useCallback(async () => {
    const id = ++requestId.current;
    setError("");
    if (!validGameId || !authenticated) {
      setInWishlist(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await api.get(`/wishlist/${validGameId}/check`);
      if (id === requestId.current) setInWishlist(Boolean(result.inWishlist));
    } catch (error) {
      if (id === requestId.current) setError(friendlyErrorMessage(error));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [validGameId, authenticated, user?.id]);
  const toggle = useCallback(async () => {
    if (!validGameId || !authenticated || busy.current) return false;
    busy.current = true;
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      if (inWishlist) await api.delete(`/wishlist/${validGameId}`);
      else await api.post("/wishlist", { gameId: validGameId });
      if (id === requestId.current) setInWishlist(!inWishlist);
      return true;
    } catch (error) {
      if (id === requestId.current) setError(friendlyErrorMessage(error));
      return false;
    } finally {
      busy.current = false;
      if (id === requestId.current) setLoading(false);
    }
  }, [validGameId, inWishlist, authenticated]);
  useEffect(() => {
    if (authStatus !== "loading") check();
    return () => {
      requestId.current += 1;
    };
  }, [check, authStatus]);
  useEffect(() => {
    const onLive = (event) => {
      if (
        event.detail?.event_type === "wishlist.updated" &&
        event.detail?.payload?.gameId === validGameId
      )
        setInWishlist(Boolean(event.detail.payload.inWishlist));
    };
    window.addEventListener("deadsmile:live", onLive);
    return () => window.removeEventListener("deadsmile:live", onLive);
  }, [validGameId]);
  return { inWishlist, loading, error, toggle };
}
