import { useLanguage } from "../context/LanguageContext";
import { useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { api, API_BASE_URL } from "./api";
import { useToast } from "../components/ui/Toast";

function emit(event) {
  window.dispatchEvent(new CustomEvent("deadsmile:live", { detail: event }));
}

function readCursor(key) {
  try {
    const value = Number(sessionStorage.getItem(key) || 0);
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeCursor(key, value) {
  try {
    sessionStorage.setItem(key, String(value));
  } catch {}
}

export function RealtimeBridge() {
  const { t } = useLanguage();
  const { status, user } = useAuth();
  const { push } = useToast();
  const pushRef = useRef(push);
  const tRef = useRef(t);
  pushRef.current = push;
  tRef.current = t;

  useEffect(() => {
    if (status === "loading" || typeof WebSocket === "undefined") return undefined;
    let active = true;
    let socket = null;
    let retryTimer = null;
    let pollTimer = null;
    let retryAttempt = 0;
    let polling = false;
    let connecting = false;
    const cursorKey =
      status === "authenticated" && user?.id
        ? `deadsmile.live.after.user.${user.id}`
        : "deadsmile.live.after.public";
    let after = readCursor(cursorKey);
    let initialized = after > 0;

    const consume = (event) => {
      const id = Number(event?.id || 0);
      if (!Number.isSafeInteger(id) || id <= 0 || id <= after) return;
      after = id;
      writeCursor(cursorKey, after);
      emit(event);
      if (event?.event_type?.endsWith(".published")) {
        pushRef.current(
          tRef.current("{0} is now available.", {
            0: event.payload?.title || "New content",
          }),
          "info",
        );
      }
    };

    const poll = async () => {
      if (!active || document.hidden || !navigator.onLine || polling) return;
      polling = true;
      try {
        for (let batch = 0; batch < 5 && active; batch += 1) {
          const events = await api.get("/platform/events", { after, limit: 100 });
          if (!active || !Array.isArray(events)) return;
          if (!initialized) {
            for (const event of events) {
              const id = Number(event?.id || 0);
              if (Number.isSafeInteger(id) && id > after) after = id;
            }
            writeCursor(cursorKey, after);
            initialized = true;
          } else {
            events.forEach(consume);
          }
          if (events.length < 100) break;
        }
      } catch {
      } finally {
        polling = false;
      }
    };

    const scheduleReconnect = () => {
      if (!active || retryTimer) return;
      const baseDelay = Math.min(30_000, 1_500 * 2 ** Math.min(retryAttempt, 4));
      const delay = baseDelay + Math.floor(Math.random() * 750);
      retryAttempt += 1;
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        connect();
      }, delay);
    };

    const connect = async () => {
      if (
        !active ||
        !navigator.onLine ||
        connecting ||
        socket?.readyState === WebSocket.OPEN ||
        socket?.readyState === WebSocket.CONNECTING
      )
        return;
      connecting = true;
      let ticket = "";
      try {
        if (status === "authenticated") {
          try {
            const result = await api.get("/platform/live-ticket");
            ticket = result?.ticket || "";
          } catch {}
        }
        if (!active) return;
        const apiUrl = new URL(
          import.meta.env.VITE_REALTIME_URL ||
            (import.meta.env.DEV ? API_BASE_URL : "https://api-ust8.onrender.com/api"),
        );
        apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
        apiUrl.pathname = `${apiUrl.pathname.replace(/\/$/, "")}/live`;
        apiUrl.search = ticket ? `?ticket=${encodeURIComponent(ticket)}` : "";
        const connection = new WebSocket(apiUrl.toString());
        socket = connection;
      } catch {
        socket = null;
        scheduleReconnect();
        return;
      } finally {
        connecting = false;
      }
      const connection = socket;
      connection.onopen = () => {
        if (!active || socket !== connection) {
          connection.close();
          return;
        }
        retryAttempt = 0;
        poll();
      };
      connection.onmessage = (message) => {
        if (!active || socket !== connection) return;
        try {
          const event = JSON.parse(message.data);
          if (event.type !== "connected") consume(event);
        } catch {}
      };
      connection.onclose = () => {
        if (socket !== connection) return;
        socket = null;
        poll();
        scheduleReconnect();
      };
      connection.onerror = () => {
        if (socket === connection) connection.close();
      };
    };

    const onOnline = () => {
      poll();
      connect();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      poll();
      connect();
    };

    poll();
    connect();
    pollTimer = window.setInterval(() => {
      if (socket?.readyState !== WebSocket.OPEN) poll();
    }, 15_000);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      socket?.close();
      window.clearTimeout(retryTimer);
      window.clearInterval(pollTimer);
    };
  }, [status, user?.id]);

  return null;
}
