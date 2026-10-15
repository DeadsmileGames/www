import { useEffect, useState } from "react";
import { api } from "../services/api";

const REFRESH_MS = 60_000;

export function usePremiere() {
  const [premiere, setPremiere] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => {
      if (document.hidden) return;
      api
        .get("/videos/premiere")
        .then((data) => alive && setPremiere(data?.premiere || null))
        .catch(() => alive && setPremiere(null));
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);
  return premiere;
}
