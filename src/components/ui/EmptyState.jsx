import './States.css';

export function EmptyState({ title = 'NO GAMES AVAILABLE', message, action }) {
  return (
    <div className="state-block" role="status">
      <h3 className="state-block__title">{title}</h3>
      {message && <p className="state-block__message">{message}</p>}
      {action}
    </div>
  );
}
