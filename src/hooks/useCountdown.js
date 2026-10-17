import { useEffect, useState } from "react";
import { useServerClock } from "./useServerClock";

const secondsLeft = (target, serverNow) => {
  if (!Number.isFinite(target)) return 0;
  if (!Number.isFinite(serverNow)) return null;
  return Math.max(0, Math.floor((target - serverNow) / 1000));
};

export function useCountdown(target) {
  const serverNow = useServerClock();
  const [seconds, setSeconds] = useState(() => secondsLeft(target, serverNow));
  useEffect(() => setSeconds(secondsLeft(target, serverNow)), [target, serverNow]);
  return seconds;
}

export function formatCountdown(total) {
  const days = Math.floor(total / 86400);
  const pad = (value) => String(value).padStart(2, "0");
  const clock = [Math.floor((total % 86400) / 3600), Math.floor((total % 3600) / 60), total % 60];
  return `${days ? `${days}d ` : ""}${pad(clock[0])}h ${pad(clock[1])}m ${pad(clock[2])}s`;
}
