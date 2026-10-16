import { useEffect, useState } from "react";
import { loadMicrosoftStoreCovers } from "../utils/microsoftStoreCover";

export function useMicrosoftStoreCovers(games, { includeUnknown = false } = {}) {
  const [covers, setCovers] = useState({});

  useEffect(() => {
    let active = true;
    const items = Array.isArray(games) ? games : [];
    if (!items.length) return () => { active = false; };

    void loadMicrosoftStoreCovers(items, { includeUnknown }).then((result) => {
      if (!active || !result.size) return;
      setCovers((current) => {
        const next = { ...current };
        for (const [key, cover] of result) next[key] = cover;
        return next;
      });
    });

    return () => {
      active = false;
    };
  }, [games, includeUnknown]);

  return covers;
}
