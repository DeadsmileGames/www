import { useLanguage } from "../context/LanguageContext";
import { useCallback, useEffect, useState } from "react";
import { api, friendlyErrorMessage } from "../services/api";

export function useGames({
  page = 1,
  limit = 12,
  featured,
  genre,
  platform,
  status,
} = {}) {
  const { language } = useLanguage();
  const [state, setState] = useState({
    status: "loading",
    games: [],
    pagination: null,
    error: null,
  });
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading", error: null }));

    api
      .get("/games", { page, limit, featured, genre, platform, status, language })
      .then((data) => {
        if (cancelled) return;
        setState({
          status: "success",
          games: data.items,
          pagination: data.pagination,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          status: "error",
          games: [],
          pagination: null,
          error: friendlyErrorMessage(err),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [page, limit, featured, genre, platform, status, revision, language]);

  useEffect(() => {
    const onLive = (event) => {
      if (/^game\.(published|updated|deleted)$/.test(event.detail?.event_type || ""))
        retry();
    };
    window.addEventListener("deadsmile:live", onLive);
    return () => window.removeEventListener("deadsmile:live", onLive);
  }, [retry]);

  return { ...state, retry };
}
