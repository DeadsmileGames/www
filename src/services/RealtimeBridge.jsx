import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api, API_BASE_URL } from './api';

function emit(event) {
  window.dispatchEvent(new CustomEvent('deadsmile:live', { detail: event }));
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
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === 'loading' || typeof WebSocket === 'undefined') return undefined;
    let active = true;
    let socket = null;
    let retryTimer = null;
    let pollTimer = null;
    let retryAttempt = 0;
    let polling = false;
    let connecting = false;
    const cursorKey = status === 'authenticated' && user?.id
      ? `deadsmile.live.after.user.${user.id}`
      : 'deadsmile.live.after.public';
    let after = readCursor(cursorKey);
    let initialized = after > 0;

    const consume = (event) => {
      const id = Number(event?.id || 0);
      if (!Number.isSafeInteger(id) || id <= 0 || id <= after) return;
      after = id;
      writeCursor(cursorKey, after);
      emit(event);
    };

    const poll = async () => {
      if (!navigator.onLine || polling) return;
      polling = true;
      try {
        for (let batch = 0; batch < 5 && active; batch += 1) {
          const events = await api.get('/platform/events', { after, limit: 100 });
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
      } catch {} finally {
        polling = false;
      }
    };

    const scheduleReconnect = () => {
      if (!active || retryTimer) return;
      const baseDelay = Math.min(30_000, 1_500 * (2 ** Math.min(retryAttempt, 4)));
      const delay = baseDelay + Math.floor(Math.random() * 750);
      retryAttempt += 1;
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        connect();
      }, delay);
    };

    const connect = async () => {
      if (!active || !navigator.onLine || connecting || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
      connecting = true;
      let ticket = '';
      try {
        if (status === 'authenticated') {
          try {
            const result = await api.get('/platform/live-ticket');
            ticket = result?.ticket || '';
          } catch {}
        }
        if (!active) return;
        const apiUrl = new URL(API_BASE_URL);
        apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        apiUrl.pathname = `${apiUrl.pathname.replace(/\/$/, '')}/live`;
        apiUrl.search = ticket ? `?ticket=${encodeURIComponent(ticket)}` : '';
        socket = new WebSocket(apiUrl.toString());
      } catch {
        socket = null;
        scheduleReconnect();
        return;
      } finally {
        connecting = false;
      }
      socket.onopen = () => {
        retryAttempt = 0;
      };
      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data);
          if (event.type !== 'connected') consume(event);
        } catch {}
      };
      socket.onclose = () => {
        socket = null;
        scheduleReconnect();
      };
      socket.onerror = () => socket?.close();
    };

    const onOnline = () => {
      poll();
      connect();
    };

    poll();
    connect();
    pollTimer = window.setInterval(poll, 15_000);
    window.addEventListener('online', onOnline);
    return () => {
      active = false;
      window.removeEventListener('online', onOnline);
      socket?.close();
      window.clearTimeout(retryTimer);
      window.clearInterval(pollTimer);
    };
  }, [push, status, user?.id]);

  return null;
}
