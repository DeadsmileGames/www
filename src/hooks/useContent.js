import { useLanguage } from "../context/LanguageContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, friendlyErrorMessage } from "../services/api";

export function useContent(path, params = {}) {
  const { language } = useLanguage();
  const requestId = useRef(0);
  const paramsKey = JSON.stringify(params);
  const [state, setState] = useState({
    status: path ? "loading" : "idle",
    data: path ? [] : null,
    error: "",
  });

  const load = useCallback(async () => {
    if (!path) {
      requestId.current += 1;
      setState({ status: "idle", data: null, error: "" });
      return null;
    }
    const id = ++requestId.current;
    setState((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const data = await api.get(path, JSON.parse(paramsKey));
      if (id === requestId.current)
        setState({ status: "success", data: data ?? [], error: "" });
      return data;
    } catch (error) {
      if (id === requestId.current) {
        setState({ status: "error", data: [], error: friendlyErrorMessage(error) });
      }
      return null;
    }
  }, [path, paramsKey, language]);

  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  useEffect(() => {
    if (!path) return undefined;
    const onLive = (event) => {
      const type = event.detail?.event_type || "";
      if (
        /^(game|news|video)\.(published|updated|deleted)$/.test(type) &&
        /^(\/newswire|\/videos|\/games)/.test(path)
      )
        load();
    };
    window.addEventListener("deadsmile:live", onLive);
    return () => window.removeEventListener("deadsmile:live", onLive);
  }, [path, load]);

  return { ...state, retry: load };
}
