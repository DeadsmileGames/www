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
      style={{ backgroundColor: "#e62117", color: "#fff", fontFamily: "Poppins, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", borderRadius: "4px", padding: "5px 10px", zIndex: 2 }}
      aria-label={t(label)}
    >
      {t(label)}
    </span>
  );
}
