import './GameMeta.css';

export function GameMeta({ game }) {
  const rows = [
    { label: 'Release date', value: game.releaseDate ? new Date(game.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'To be announced' },
    { label: 'Platforms', value: game.platforms?.join(', ') || '—' },
    { label: 'Genres', value: game.genres?.join(', ') || '—' },
    { label: 'Status', value: game.status?.replace('_', ' ') || '—' },
  ];

  return (
    <dl className="game-meta">
      {rows.map((row) => (
        <div className="game-meta__row" key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
