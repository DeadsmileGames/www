import { useEffect, useState } from "react";
import { api } from "../services/api";

const RESYNC_INTERVAL_MS = 60_000;
const listeners = new Set();
let serverEpochAtSync = null;
let performanceAtSync = null;
let lastSyncPerformanceAt = 0;
let syncInFlight = null;
let clockTimer = null;

function readServerNow() {
  if (serverEpochAtSync === null || performanceAtSync === null) return null;
  return Math.floor(serverEpochAtSync + (performance.now() - performanceAtSync));
}

function publishTime() {
  const now = readServerNow();
  for (const listener of listeners) listener(now);
}

export function getServerNow() {
  return readServerNow();
}

export async function syncServerClock() {
  if (syncInFlight) return syncInFlight;
  syncInFlight = (async () => {
    const requestStartedAt = performance.now();
    lastSyncPerformanceAt = requestStartedAt;
    let timeZone = "UTC";
    try {
      const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (typeof detectedTimeZone === "string" && detectedTimeZone.length <= 100) timeZone = detectedTimeZone;
    } catch {
      // The server timestamp is authoritative even if zone detection fails.
    }
    try {
      const result = await api.get(`/time?timeZone=${encodeURIComponent(timeZone)}`);
      const responseReceivedAt = performance.now();
      const epochMs = Number(result?.epochMs);
      if (!Number.isFinite(epochMs) || epochMs <= 0) return readServerNow();
      serverEpochAtSync = Math.round(epochMs + (responseReceivedAt - requestStartedAt) / 2);
      performanceAtSync = responseReceivedAt;
      lastSyncPerformanceAt = responseReceivedAt;
      publishTime();
      return readServerNow();
    } catch {
      // If the API briefly fails, retain the last sync and advance monotonically.
      return readServerNow();
    }
  })().finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}

function ensureClockRunning() {
  if (clockTimer !== null) return;
  void syncServerClock();
  clockTimer = window.setInterval(() => {
    publishTime();
    if (performance.now() - lastSyncPerformanceAt >= RESYNC_INTERVAL_MS) void syncServerClock();
  }, 1000);
}

export function useServerClock() {
  const [now, setNow] = useState(() => readServerNow());
  useEffect(() => {
    listeners.add(setNow);
    setNow(readServerNow());
    ensureClockRunning();
    return () => listeners.delete(setNow);
  }, []);
  return now;
}
