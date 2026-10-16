import { LoadingSpinner } from "./LoadingSpinner";

export function Button({
  variant = "primary",
  as: As = "button",
  className = "",
  loading = false,
  disabled = false,
  children,
  ...props
}) {
  const classes = new Set([
    "btn",
    `btn--${variant}`,
    ...String(className).split(/\s+/).filter(Boolean),
  ]);
  return (
    <As
      className={[...classes].join(" ")}
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || props["aria-busy"] || undefined}
    >
      {loading && <LoadingSpinner />}
      {children}
    </As>
  );
}
