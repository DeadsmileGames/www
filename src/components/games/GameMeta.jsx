import { useLanguage } from "../../context/LanguageContext";
import { formatReleaseDate } from "../../utils/releaseDate";
export function GameMeta({ game }) {
  const { t, language } = useLanguage();
  const rows = [
    {
      label: t("Release date"),
      value:
        formatReleaseDate(game.releaseDate, language, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }) || t("To be announced"),
    },
    { label: t("Platforms"), value: game.platforms?.join(", ") || "—" },
    {
      label: t("Genres"),
      value: game.genres?.map((genre) => t(genre)).join(", ") || "—",
    },
    { label: t("Status"), value: t(game.status) || "—" },
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
