import { useLanguage } from "../../context/LanguageContext";

export function Skeleton({ className = "", style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonLines({ count = 3 }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          style={{
            height: 16,
            width: index === count - 1 ? "65%" : "100%",
            borderRadius: 6,
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonGameGrid({ count = 8 }) {
  const { t } = useLanguage();
  return (
    <div role="status" aria-label={t("Loading")}>
      <div className="game-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div className="game-card" key={index}>
            <Skeleton className="game-card__image" style={{ marginBottom: 20 }} />
            <Skeleton style={{ height: 28, width: "75%", marginBottom: 12 }} />
            <Skeleton style={{ height: 16, width: "50%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonHero({ launcher = false, product = false }) {
  if (launcher || product)
    return (
      <header className="rs-hero" aria-hidden="true">
        <div className="rs-hero__content container">
          <div className="rs-hero__identity">
            <div className="rs-hero__text-col">
              <Skeleton className="rs-hero__title" />
              <div className="rs-hero__actions">
                <Skeleton
                  className={product ? "game-details__btn" : "launcher-page__badge"}
                  style={product ? { width: 160, height: 48 } : undefined}
                />
                {product && <Skeleton style={{ width: 140, height: 48 }} />}
                <Skeleton className="launcher-page__pause" />
              </div>
            </div>
            <Skeleton className="rs-hero__logo" />
          </div>
        </div>
      </header>
    );
  return (
    <section className="rs-hero" aria-hidden="true" style={{ background: "#111" }}>
      <div className="rs-hero__content container">
        <div className="rs-hero__identity" style={{ flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <Skeleton style={{ height: 60, width: "70%", marginBottom: 24 }} />
            <SkeletonLines count={2} />
            <div className="studio-actions" style={{ marginTop: 24 }}>
              <Skeleton style={{ width: 160, height: 48 }} />
              <Skeleton style={{ width: 160, height: 48 }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SkeletonDetail({ launcher = false }) {
  const { t } = useLanguage();
  const screenshots = (
    <section className="game-details__screenshots">
      <Skeleton
        className="game-details__screenshots-title launcher-page__section-title"
        style={{ width: 220 }}
      />
      <div className="game-details__screenshots-grid">
        {[0, 1].map((index) => (
          <Skeleton
            key={index}
            className="game-details__screenshot-item"
            style={{ aspectRatio: "16/9" }}
          />
        ))}
      </div>
    </section>
  );
  const about = (
    <section
      className="launcher-page__about"
      style={launcher ? undefined : { marginTop: 0 }}
    >
      <Skeleton className="launcher-page__section-title" style={{ width: "40%" }} />
      <SkeletonLines count={5} />
      <div className="game-meta" style={{ marginTop: 24 }}>
        <Skeleton style={{ height: 24, width: "65%" }} />
      </div>
    </section>
  );
  return (
    <div
      className={`game-details ${launcher ? "launcher-page" : "game-product-page"}`}
      role="status"
      aria-label={t("Loading")}
    >
      <SkeletonHero launcher={launcher} product={!launcher} />
      <div className="container game-details__body">
        <div className="game-details__main">
          {launcher ? (
            <>
              {screenshots}
              {about}
            </>
          ) : (
            <>
              {about}
              {screenshots}
            </>
          )}
        </div>
        <aside className="game-details__aside">
          <div className="game-meta">
            <Skeleton style={{ height: 30, marginBottom: 24 }} />
            <Skeleton style={{ width: 80, height: 80, marginBottom: 20 }} />
            <SkeletonLines count={2} />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function SkeletonNews({ detail = false, count = 3, tiles = false }) {
  if (detail)
    return (
      <>
        <Skeleton style={{ height: 48, width: "70%", marginBottom: 20 }} />
        <SkeletonLines count={2} />
        <Skeleton style={{ aspectRatio: "16/9", margin: "32px 0" }} />
        <SkeletonLines count={7} />
      </>
    );
  return (
    <div
      className={tiles ? "news-grid" : "news-page__list"}
      style={tiles ? undefined : { display: "grid", gap: 32 }}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className={tiles ? "news-tile" : "news-featured"}>
          <Skeleton style={{ aspectRatio: "16/9", minHeight: 160 }} />
          <div className={tiles ? "" : "news-featured__meta"}>
            <Skeleton style={{ width: "35%", margin: "20px 0 16px" }} />
            <Skeleton style={{ height: 30, width: "80%", marginBottom: 20 }} />
            <SkeletonLines count={2} />
            <Skeleton style={{ height: 48, width: 140, marginTop: 24 }} />
          </div>
        </article>
      ))}
    </div>
  );
}

export function SkeletonVideos({ count = 3 }) {
  return (
    <div className="video-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="video-tile" key={index}>
          <Skeleton style={{ aspectRatio: "16/9", marginBottom: 20 }} />
          <Skeleton style={{ width: "30%", marginBottom: 14 }} />
          <Skeleton style={{ width: "80%", height: 28 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 3 }) {
  return (
    <div style={{ display: "grid", gap: 18 }} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="account-row"
          style={{ display: "flex", alignItems: "center", gap: 20 }}
        >
          <Skeleton style={{ width: 48, height: 48, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonLines count={2} />
          </div>
          <Skeleton style={{ width: 100, height: 40, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile({ account = false }) {
  return (
    <>
      <header className="profile-page__hero">
        <Skeleton style={{ width: account ? 95 : 110, height: account ? 95 : 110, borderRadius: "50%" }} />
        <div style={{ flex: 1 }}>
          <Skeleton style={{ height: 36, width: "50%", marginBottom: 20 }} />
          <SkeletonLines count={2} />
        </div>
      </header>
      <SkeletonGameGrid count={3} />
    </>
  );
}

export function SkeletonSearch() {
  return (
    <ul className="search-overlay__list" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <li className="search-overlay__result" key={index}>
          <Skeleton
            className="search-overlay__thumb"
            style={{ width: 90, height: 68, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <SkeletonLines count={2} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SkeletonPage({ path }) {
  const { t } = useLanguage();
  if (path === "/launcher" || /^\/games\//.test(path))
    return <SkeletonDetail launcher={path === "/launcher"} />;
  if (path === "/")
    return (
      <div role="status" aria-label={t("Loading")}>
        <SkeletonHero />
        <section className="studio-section container">
          <SkeletonGameGrid count={3} />
        </section>
      </div>
    );
  if (/^\/(login|register|forgot-password|reset-password)$/.test(path))
    return (
      <div className="auth-page" role="status" aria-label={t("Loading")}>
        <div className="auth-page__card">
          <Skeleton style={{ height: 40, width: "70%", marginBottom: 32 }} />
          {Array.from(
            {
              length:
                path === "/register"
                  ? 4
                  : path === "/login" || path === "/reset-password"
                    ? 2
                    : 1,
            },
            (_, index) => (
              <div className="auth-page__field" key={index}>
                <Skeleton style={{ width: "35%", marginBottom: 12 }} />
                <Skeleton style={{ height: 48 }} />
              </div>
            ),
          )}
          <Skeleton style={{ height: 48, marginTop: 24 }} />
        </div>
      </div>
    );
  let content;
  let className = "games-page container";
  if (/^\/newswire\//.test(path)) {
    className = "news-detail container";
    content = <SkeletonNews detail />;
  } else if (path === "/newswire") {
    className = "news-page container";
    content = <SkeletonNews />;
  } else if (/^\/profile\//.test(path)) {
    className = "profile-page container";
    content = <SkeletonProfile />;
  } else if (path === "/admin") {
    className = "account-page container";
    content = (
      <>
        <header className="account-row--inline" style={{ alignItems: "flex-start", marginBottom: 32 }}>
          <div className="account-block__head" style={{ flex: 1, minWidth: 0 }}>
            <Skeleton style={{ width: 132, height: 13, marginBottom: 14 }} />
            <Skeleton style={{ width: "52%", height: 42, marginBottom: 12 }} />
            <Skeleton style={{ width: "75%", height: 16 }} />
          </div>
          <Skeleton style={{ width: 148, height: 46 }} />
        </header>
        <div className="account-page__layout">
          <nav aria-hidden="true">
            <div className="account-nav-title"><Skeleton style={{ width: 80, height: 11 }} /></div>
            {[0, 1, 2, 3].map((index) => (
              <div className="account-nav-item" key={index}>
                <Skeleton style={{ width: 18, height: 18, flexShrink: 0 }} />
                <Skeleton style={{ width: index === 0 ? "45%" : "60%", height: 14 }} />
              </div>
            ))}
          </nav>
          <div className="account-page__content">
            <section className="support-card support-faq-panel account-block">
              <Skeleton style={{ width: "46%", height: 30, marginBottom: 14 }} />
              <Skeleton style={{ width: "72%", height: 16, marginBottom: 26 }} />
              <div className="studio-game-strip" style={{ margin: "0 0 28px", padding: 24, gap: 20 }}>
                {[0, 1, 2].map((index) => (
                  <div key={index}>
                    <Skeleton style={{ width: "58%", height: 14, marginBottom: 12 }} />
                    <Skeleton style={{ width: 70, height: 32 }} />
                  </div>
                ))}
              </div>
              <Skeleton style={{ width: "34%", height: 25, marginBottom: 12 }} />
              <div className="studio-actions" style={{ marginTop: 0 }}>
                {[0, 1, 2].map((index) => (
                  <Skeleton key={index} style={{ width: 150, height: 46 }} />
                ))}
              </div>
            </section>
            <section className="support-card support-contact-panel">
              <Skeleton style={{ width: "42%", height: 30, marginBottom: 20 }} />
              {[0, 1, 2].map((index) => (
                <div className="account-row" key={index}>
                  <Skeleton style={{ width: "62%", height: 17 }} />
                  <Skeleton style={{ width: 96, height: 40 }} />
                </div>
              ))}
            </section>
          </div>
        </div>
      </>
    );
  } else if (path === "/account") {
    className = "account-page container";
    content = (
      <>
        <SkeletonProfile account />
        <div className="account-page__layout">
          <nav aria-hidden="true">
            {[0, 1, 2, 3, 4].map((index) => (
              <div className="account-nav-item" key={index}>
                <Skeleton style={{ width: 18, height: 18, flexShrink: 0 }} />
                <Skeleton style={{ width: index === 4 ? "74%" : "58%", height: 14 }} />
              </div>
            ))}
            <div className="account-nav-title">
              <Skeleton style={{ width: 70, height: 11 }} />
            </div>
            <div className="account-nav-item account-page__wishlist">
              <Skeleton style={{ width: 18, height: 18, flexShrink: 0 }} />
              <Skeleton style={{ width: "48%", height: 14 }} />
            </div>
          </nav>
          <div className="account-page__content">
            <div className="support-faq-panel support-card">
              <section className="account-block">
                <Skeleton style={{ width: "46%", height: 30, marginBottom: 12 }} />
                <Skeleton style={{ width: "72%", height: 17, marginBottom: 18 }} />
                <SkeletonRows count={4} />
                <div className="account-block__foot">
                  <Skeleton style={{ width: 160, height: 46 }} />
                </div>
              </section>
            </div>
          </div>
        </div>
      </>
    );
  } else if (path === "/presskit") {
    className = "press-kit-page container";
    content = (
      <div className="press-kit__game-grid">
        {[0, 1].map((index) => (
          <div key={index} className="press-kit__game-card">
            <Skeleton style={{ height: 32, marginBottom: 24 }} />
            <SkeletonLines count={5} />
          </div>
        ))}
      </div>
    );
  } else if (["/games", "/wishlist", "/search"].includes(path))
    content = <SkeletonGameGrid count={6} />;
  else if (["/privacy", "/terms"].includes(path)) {
    const type = path.slice(1);
    className = `${type}-page container`;
    content = (
      <section className={`${type}-page__content`}>
        {[0, 1, 2, 3].map((index) => (
          <div className={`${type}-block`} key={index}>
            <Skeleton style={{ width: "50%", height: 28, marginBottom: 20 }} />
            <SkeletonLines count={3} />
          </div>
        ))}
      </section>
    );
  } else if (path === "/support") {
    className = "support-page container";
    content = (
      <>
        <section className="support-quick-grid">
          {[0, 1].map((index) => (
            <div className="support-card" key={index}>
              <SkeletonLines count={2} />
            </div>
          ))}
        </section>
        <div className="support-layout">
          <section className="support-contact-panel support-card">
            <SkeletonLines count={2} />
            {[0, 1, 2].map((index) => (
              <Skeleton
                key={index}
                style={{ height: index === 2 ? 130 : 48, marginTop: 24 }}
              />
            ))}
          </section>
          <section className="support-faq-panel support-card">
            <SkeletonLines count={8} />
          </section>
        </div>
      </>
    );
  } else if (path === "/about") {
    className = "studio-page";
    content = (
      <>
        <section className="container studio-page__story">
          <SkeletonLines count={3} />
        </section>
        <section className="container studio-page__grid">
          {[0, 1, 2].map((index) => (
            <div key={index}>
              <Skeleton style={{ height: 32, marginBottom: 24 }} />
              <SkeletonLines count={3} />
            </div>
          ))}
        </section>
      </>
    );
  } else if (path.startsWith("/newsletter/") || path === "/verify-email") {
    className = "newsletter-action page-section";
    content = (
      <div className="newsletter-action__card">
        <Skeleton
          style={{ width: 60, height: 60, borderRadius: "50%", margin: "0 auto 24px" }}
        />
        <Skeleton style={{ height: 36, width: "80%", margin: "0 auto 24px" }} />
        <SkeletonLines count={2} />
        <Skeleton style={{ height: 48, marginTop: 24 }} />
      </div>
    );
  } else {
    className = "not-found";
    content = <Skeleton style={{ width: 160, height: 48, margin: "0 auto" }} />;
  }
  return (
    <div className={className} role="status" aria-label={t("Loading")}>
      {className !== "newsletter-action page-section" && path !== "/admin" && (
        <>
          {path === "/account" && (
            <Skeleton style={{ width: 86, height: 18, marginBottom: 20 }} />
          )}
          <Skeleton style={{ height: 42, width: "45%", marginBottom: 40 }} />
        </>
      )}
      {content}
    </div>
  );
}
