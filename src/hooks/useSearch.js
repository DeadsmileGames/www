import { useLanguage } from "../context/LanguageContext";
import { useCallback, useEffect, useState } from "react";
import { api, friendlyErrorMessage } from "../services/api";
import { useDebounce } from "./useDebounce";

export function useSearch(query, { page = 1, limit = 10 } = {}) {
  const { language } = useLanguage();
  const debouncedQuery = useDebounce(query, 320);
  const [state, setState] = useState({
    status: "idle",
    results: [],
    pagination: null,
    error: null,
  });
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const trimmed = query.trim().slice(0, 80);
    if (!trimmed) {
      setState({ status: "idle", results: [], pagination: null, error: null });
      return;
    }

    if (trimmed !== debouncedQuery.trim().slice(0, 80)) {
      setState({ status: "loading", results: [], pagination: null, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading", error: null }));

    api
      .get("/search", { q: trimmed, page, limit })
      .then((data) => {
        if (cancelled) return;
        setState({
          status: "success",
          results: data.items,
          pagination: data.pagination,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          status: "error",
          results: [],
          pagination: null,
          error: friendlyErrorMessage(err),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [query, debouncedQuery, page, limit, revision, language]);

  useEffect(() => {
    const update = (event) => {
      if (/^(game|news|video)\.(published|updated|deleted)$/.test(event.detail?.event_type || ""))
        retry();
    };
    window.addEventListener("deadsmile:live", update);
    return () => window.removeEventListener("deadsmile:live", update);
  }, [retry]);
  return { ...state, retry };
}
