
export function Button({ variant = 'primary', as: As = 'button', className = '', ...props }) {
  const classes = new Set(['btn', `btn--${variant}`, ...String(className).split(/\s+/).filter(Boolean)]);
  return <As className={[...classes].join(' ')} {...props} />;
}
