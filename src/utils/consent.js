import { useEffect, useState } from "react";
const KEY = "deadsmile.optional-content";
export function optionalContentAllowed() {
  try {
    return localStorage.getItem(KEY) === "accepted";
  } catch {
    return false;
  }
}
export function setOptionalContent(allowed) {
  try {
    localStorage.setItem(KEY, allowed ? "accepted" : "declined");
  } catch {}
  window.dispatchEvent(new CustomEvent("deadsmile:consent", { detail: { allowed } }));
}
export function useOptionalContent() {
  const [allowed, setAllowed] = useState(optionalContentAllowed);
  useEffect(() => {
    const update = (event) =>
      setAllowed(event.detail?.allowed ?? optionalContentAllowed());
    window.addEventListener("deadsmile:consent", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("deadsmile:consent", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return allowed;
}
export function hasContentPreference() {
  try {
    return ["accepted", "declined"].includes(localStorage.getItem(KEY));
  } catch {
    return false;
  }
}
