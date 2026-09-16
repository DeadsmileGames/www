import './Button.css';

export function Button({ variant = 'primary', as: As = 'button', className = '', ...props }) {
  return <As className={`btn btn--${variant} ${className}`} {...props} />;
}
