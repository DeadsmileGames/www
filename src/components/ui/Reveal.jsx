export function Reveal({ children, className = "" }) {
  return <div className={`reveal ${className}`}>{children}</div>;
}
