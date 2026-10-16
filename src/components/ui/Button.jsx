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
  const busy = Boolean(loading || props["aria-busy"]);
  const isUnavailable = Boolean(disabled || loading);
  const elementProps =
    As === "button"
      ? { disabled: isUnavailable }
      : { "aria-disabled": isUnavailable || props["aria-disabled"] || undefined };
  return (
    <As
      className={[...classes].join(" ")}
      {...props}
      {...elementProps}
      aria-busy={busy || undefined}
    >
      {loading && <LoadingSpinner />}
      {children}
    </As>
  );
}
