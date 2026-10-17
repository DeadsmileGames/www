import { useLanguage } from "../context/LanguageContext";
import { AutoLinkText } from "../components/ui/AutoLinkText";
import { useState } from "react";
import { ProductHero, productIcon } from "../components/games/ProductHero";
import { useContent } from "../hooks/useContent";
import { StoreInformation, StoreRatings } from "../components/games/StoreInformation";
import { SkeletonDetail } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { Lightbox } from "../components/ui/Lightbox";
import { safeImageUrl } from "../utils/urls";
import { GithubLogo } from "@phosphor-icons/react";

const STORE_URL = "https://apps.microsoft.com/detail/9p6p8284v337?hl=pt-BR&gl=BR";
const ABBY_SCREENSHOTS = [1, 2, 3, 4, 5, 6].map(
  (index) => `/assets/games/screenshots/abbys-restless-heart/${index}.png`,
);

export function Launcher() {
  const { t, language } = useLanguage();
  const resource = useContent("/launcher");
  const store = resource.status === "success" ? resource.data : null;
  const [selected, setSelected] = useState(null);
  const screenshots = (store?.screenshots || [])
    .map((item) => ({ ...item, url: safeImageUrl(item.url) }))
    .filter((item) => item.url);
  const images = screenshots.map((item) => item.url);
  const icon = safeImageUrl(productIcon(store));
  const badgeLocale = { "pt-BR": "pt-br", en: "en-us", es: "es-es" }[language] || "en-us";
  const selectedIndex =
    selected === null || !images.length ? null : Math.min(selected, images.length - 1);
  if (resource.status === "loading") return <SkeletonDetail launcher />;
  return (
    <div className="game-details launcher-page">
      <ProductHero
        title="Deadsmile Games Launcher"
        icon={icon}
        images={ABBY_SCREENSHOTS}
        enabled={resource.status === "success"}
      >
        <a href={STORE_URL} target="_self" aria-label={t("Get it from Microsoft Store")}>
          <img
            className="launcher-page__badge"
            src={`https://get.microsoft.com/images/${badgeLocale}%20dark.svg`}
            width="200"
            alt={t("Get it from Microsoft Store")}
          />
        </a>
      </ProductHero>
      {resource.status === "error" && (
        <div className="container game-details__notfound">
          <ErrorState message={resource.error} onRetry={resource.retry} />
        </div>
      )}
      {store && (
        <div className="container game-details__body">
          <div className="game-details__main">
            {screenshots.length > 0 && (
              <section className="game-details__screenshots">
                <h2 className="game-details__screenshots-title launcher-page__section-title">
                  {t("Screenshots")}
                </h2>
                <div className="game-details__screenshots-grid">
                  {screenshots.map((item, index) => (
                    <button
                      type="button"
                      className="game-details__screenshot-item"
                      key={item.url}
                      onClick={() => setSelected(index)}
                      aria-label={t("Open screenshot {0}", { 0: index + 1 })}
                    >
                      <img
                        src={item.url}
                        alt={item.caption || t("Screenshot {0}", { 0: index + 1 })}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section className={screenshots.length ? "launcher-page__about" : undefined}>
              <h2 className="launcher-page__section-title">{t("games.about")}</h2>
              <p className="game-details__description"><AutoLinkText>{store.description}</AutoLinkText></p>
              <StoreInformation store={store} />
            </section>
          </div>
          <aside className="game-details__aside">
            <StoreRatings store={store} />
            <section className="game-meta">
              <h3>{t("Also available on")}</h3>
              <p>
                {t("Take your games on the go with the Deadsmile companion app for Android.")}
              </p>
              <a
                className="launcher-page__github-badge"
                href="https://github.com/DeadsmileGames/mobile-app/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("Get it on GitHub")}
              >
                <GithubLogo size={32} weight="fill" aria-hidden="true" />
                <span className="launcher-page__github-badge-copy" aria-hidden="true">
                  <span>GET IT ON</span>
                  <strong>GitHub</strong>
                </span>
              </a>
            </section>
          </aside>
        </div>
      )}
      <Lightbox
        images={images}
        selectedIndex={selectedIndex}
        onClose={() => setSelected(null)}
        onPrev={() =>
          setSelected((index) =>
            index === null || !images.length
              ? null
              : (Math.min(index, images.length - 1) - 1 + images.length) % images.length,
          )
        }
        onNext={() =>
          setSelected((index) =>
            index === null || !images.length
              ? null
              : (Math.min(index, images.length - 1) + 1) % images.length,
          )
        }
      />
    </div>
  );
}
