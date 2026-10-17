import {
  useLanguage } from "../context/LanguageContext";
import { Skeleton,
  SkeletonLines } from "../components/ui/Skeleton";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft,
  Download,
  GameController,
} from "@phosphor-icons/react";
import { Reveal } from "../components/ui/Reveal";
import { useGames } from "../hooks/useGames";
import { ErrorState } from "../components/ui/ErrorState";
import { Lightbox } from "../components/ui/Lightbox";
import { formatReleaseDate } from "../utils/releaseDate";
import { AutoLinkText } from "../components/ui/AutoLinkText";

export function PressKit() {
  const { t, language } = useLanguage();
  const { games, status, error, retry } = useGames({ limit: 48 });
  const loading = status === "loading";
  const [selectedIndex, setSelectedIndex] = useState(null);

  const totalImages = 9;
  const galleryImages = Array.from(
    { length: totalImages },
    (_, i) => `/assets/media/press/${i + 1}.png`,
  );

  const openLightbox = (index) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goPrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + galleryImages.length) % galleryImages.length);
  };

  const goNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % galleryImages.length);
  };

  return (
    <div className="press-kit-page container">
      

      <Reveal>
        <header className="press-kit__header">
          <h1>{t("Press Kit")}</h1>
          <p className="press-kit__intro">
            {t(
              "Resources for journalists, streamers, and content creators. All assets are free to use for coverage and promotion of Deadsmile Games.",
            )}
          </p>
          <div className="press-kit__contact">
            <a href="mailto:deadsmilegames@gmail.com">deadsmilegames@gmail.com</a>
          </div>
        </header>
      </Reveal>

      <section className="press-kit__download">
        <Reveal>
          <div className="download-card">
            <div>
              <h2>{t("Media Pack")}</h2>
              <p>
                {t(
                  "Includes logos, screenshots, concept art, wallpapers, and fact sheet. Updated with each major release.",
                )}
              </p>
            </div>
            <a
              href="/press/deadsmile-press-kit.zip"
              className="btn btn--primary"
              download
            >
              <Download weight="bold" />
              {t("Download .zip (\u2248 1 MB)")}
            </a>
          </div>
        </Reveal>
      </section>

      <section className="press-kit__games">
        <Reveal>
          <h2>{t("Game Fact Sheets")}</h2>
          <p className="press-kit__subsection-intro">
            {t(
              "Official details for each title. Feel free to use these descriptions in your articles.",
            )}
          </p>
        </Reveal>

        {loading && (
          <div className="press-kit__game-grid">
            {[0, 1].map((index) => (
              <article className="press-kit__game-card" key={index}>
                <Skeleton style={{ height: 32, marginBottom: 24 }} />
                <SkeletonLines count={5} />
              </article>
            ))}
          </div>
        )}
        {error && <ErrorState message={error} onRetry={retry} />}

        {!loading && !error && games.length === 0 && (
          <p className="press-kit__empty">{t("No games available yet.")}</p>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="press-kit__game-grid">
            {games.map((game) => (
              <Reveal key={game.id}>
                <article className="press-kit__game-card">
                  <div className="press-kit__game-header">
                    <GameController weight="bold" size={24} />
                    <h3>{game.title}</h3>
                  </div>
                  <ul className="press-kit__game-meta">
                    <li>
                      <strong>{t("Genre:")}</strong>{" "}
                      {game.genres?.map((genre) => t(genre)).join(", ") || "—"}
                    </li>
                    <li>
                      <strong>{t("Platforms:")}</strong>{" "}
                      {game.platforms?.join(", ") || "—"}
                    </li>
                    <li>
                      <strong>{t("Release:")}</strong>{" "}
                      {formatReleaseDate(game.releaseDate, language, {
                        year: "numeric",
                        month: "long",
                      }) || t("To be announced")}
                    </li>
                    <li>
                      <strong>{t("Status:")}</strong> {t(game.status) || "—"}
                    </li>
                  </ul>
                  <p>
                    <AutoLinkText>
                      {game.shortDescription ||
                        game.description ||
                        t("No description available.")}
                    </AutoLinkText>
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="press-kit__gallery">
        <Reveal>
          <h2>{t("Media Gallery")}</h2>
          <p className="press-kit__subsection-intro">
            {t("Official logos, key art, screenshots, and concept visuals.")}
          </p>
        </Reveal>
        <div className="press-kit__gallery-grid">
          {galleryImages.map((src, i) => (
            <button
              type="button"
              className="press-kit__gallery-item"
              key={i}
              onClick={() => openLightbox(i)}
              aria-label={t("Open image {0}", { 0: i + 1 })}
            >
              <img
                src={src}
                alt={t("Press kit media {0}", { 0: i + 1 })}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </section>

      <section className="press-kit__guidelines">
        <Reveal>
          <h2>{t("Usage Guidelines")}</h2>
          <ul>
            <li>
              {t("All assets are provided for ")}
              <strong>{t("editorial and promotional")}</strong>
              {t(" purposes only.")}
            </li>
            <li>
              {t(
                "You may crop, resize, or overlay text on images, but do not alter logos or artwork in a misleading way.",
              )}
            </li>
            <li>
              {t("Always credit ")}
              <strong>Deadsmile Games</strong>
              {t(" when using these assets.")}
            </li>
            <li>
              {t("For commercial use outside editorial coverage, please contact ")}
              <a href="mailto:deadsmilegames@gmail.com">deadsmilegames@gmail.com</a>.
            </li>
          </ul>
        </Reveal>
      </section>

      <Lightbox
        images={galleryImages}
        selectedIndex={selectedIndex}
        onClose={closeLightbox}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}
