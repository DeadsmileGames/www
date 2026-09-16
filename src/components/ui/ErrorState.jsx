import { Button } from './Button';
import './States.css';

export function ErrorState({
  title = 'UNABLE TO LOAD CONTENT',
  message = 'Something on our end went wrong.',
  onRetry,
}) {
  return (
    <div className="state-block" role="alert">
      <h3 className="state-block__title">{title}</h3>
      <p className="state-block__message">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
