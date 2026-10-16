import { useEffect, useState } from "react";

const secondsLeft = (target) =>
  Number.isFinite(target) ? Math.max(0, Math.floor((target - Date.now()) / 1000)) : 0;

export function useCountdown(target) {
  const [seconds, setSeconds] = useState(() => secondsLeft(target));
  useEffect(() => {
    setSeconds(secondsLeft(target));
    if (!Number.isFinite(target)) return undefined;
    const timer = setInterval(() => setSeconds(secondsLeft(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);
  return seconds;
}

export function formatCountdown(total) {
  const days = Math.floor(total / 86400);
  const pad = (value) => String(value).padStart(2, "0");
  const clock = [Math.floor((total % 86400) / 3600), Math.floor((total % 3600) / 60), total % 60];
  return `${days ? `${days}d ` : ""}${pad(clock[0])}h ${pad(clock[1])}m ${pad(clock[2])}s`;
}
