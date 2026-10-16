export function LoadingSpinner({ className = "" }) {
  return (
    <span
      className={["loading-spinner", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}
