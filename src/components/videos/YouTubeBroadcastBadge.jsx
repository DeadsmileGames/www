import { useLanguage } from "../../context/LanguageContext";

// Uses the existing game-card badge position so video cards keep the site UI.
export function YouTubeBroadcastBadge({ video }) {
  const { t } = useLanguage();
  const state = video?.youtube?.state || video?.state;
  const label = state === "live" ? "Live now" : state === "upcoming" ? "Premiere" : null;
  if (!label) return null;

  return (
    <span
      className="game-card__badge"
      style={{ backgroundColor: "#e62117", color: "#fff", fontWeight: 700, zIndex: 2 }}
      aria-label={t(label)}
    >
      {t(label)}
    </span>
  );
}
