import { DownloadSimple } from "@phosphor-icons/react";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { useLanguage } from "../../context/LanguageContext";
import { safeItchUrl } from "../../utils/urls";

function storeHref(value) {
  try {
    const url = new URL(value);
    return url.origin === "https://apps.microsoft.com" &&
      /^\/detail\/[A-Z0-9]{12}$/i.test(url.pathname) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function StoreOffers({ game, onDownload, downloadBusy = false }) {
  const { t, language } = useLanguage();
  const badgeLocale = { "pt-BR": "pt-br", en: "en-us", es: "es-es" }[language] || "en-us";

  return (
    <div className="product-offers">
      {(game.offers || []).map((offer) => {
        if (offer.provider === "direct") {
          return game.isFree && game.downloadAvailable && onDownload ? (
            <div className="product-offer" key="direct">
              <button
                type="button"
                className="btn btn--primary"
                disabled={downloadBusy}
                onClick={onDownload}
              >
                {downloadBusy ? <LoadingSpinner /> : <DownloadSimple weight="bold" />}
                {t(downloadBusy ? "Preparing download…" : "Download now")}
              </button>
            </div>
          ) : null;
        }

        const href =
          offer.provider === "itch"
            ? safeItchUrl(offer.href)
            : offer.provider === "microsoft"
              ? storeHref(offer.href)
              : null;

        if (!href) return null;

        let price = null;
        if (!game.isFree && offer.price) {
          if (typeof offer.price.display === "string") price = offer.price.display;
          else if (
            Number.isFinite(offer.price.amount) &&
            offer.price.amount >= 0 &&
            /^[A-Z]{3}$/.test(offer.price.currency || "")
          ) {
            price = new Intl.NumberFormat(language, {
              style: "currency",
              currency: offer.price.currency,
            }).format(offer.price.amount);
          }
        }
        const microsoft = offer.provider === "microsoft";
        const label = t(
          microsoft
            ? game.isFree
              ? "Get on Microsoft Store"
              : "Buy on Microsoft Store"
            : game.isFree
              ? "Get on itch.io"
              : "Buy on itch.io",
        );

        return (
          <div className="product-offer" key={offer.provider}>
            {price && <span className="product-offer__price">{price}</span>}
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
              <img
                className="launcher-page__badge"
                src={
                  microsoft
                    ? `https://get.microsoft.com/images/${badgeLocale}%20dark.svg`
                    : "/itch.svg"
                }
                width="200"
                height="60"
                alt={microsoft ? t("Get it from Microsoft Store") : label}
                loading="lazy"
              />
            </a>
          </div>
        );
      })}
    </div>
  );
}
