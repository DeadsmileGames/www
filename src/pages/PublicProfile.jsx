import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  Images,
  ShoppingCart,
  Trophy,
  X,
} from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { useMicrosoftStoreCovers } from "../hooks/useMicrosoftStoreCovers";
import { api, friendlyErrorMessage } from "../services/api";
import { SkeletonProfile } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { Modal } from "../components/ui/Modal";
import { Lightbox } from "../components/ui/Lightbox";
import { safeHttpsUrl, safeImageUrl, safeItchUrl } from "../utils/urls";

const PLACEHOLDER = "/assets/placeholders/game-cover.svg";

function duration(value) {
  const milliseconds = Math.max(0, Number(value) || 0);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);

  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function PublicProfile() {
  const { t, language } = useLanguage();
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [gallery, setGallery] = useState(null);
  const [selected, setSelected] = useState(null);
  const storeCovers = useMicrosoftStoreCovers(profile?.recentGames || []);

  useEffect(() => {
    let active = true;

    setProfile(null);
    setError("");
    setAvatarFailed(false);
    setGallery(null);
    setSelected(null);

    const name = String(username || "")
      .trim()
      .toLowerCase();

    api
      .get(`/account/profile/${encodeURIComponent(name)}`)
      .then((data) => {
        if (!active) return;

        if (!data || typeof data.username !== "string") {
          setError(friendlyErrorMessage({ code: "INVALID_RESPONSE" }));
          return;
        }

        setProfile(data);
      })
      .catch((failure) => {
        if (active) setError(friendlyErrorMessage(failure));
      });

    return () => {
      active = false;
    };
  }, [username, language, revision]);

  const closeGallery = () => {
    setSelected(null);
    setGallery(null);
  };

  if (error) {
    return (
      <div className="profile-page container">
        <ErrorState message={error} onRetry={() => setRevision((value) => value + 1)} />

        <Link to="/" className="back-link" style={{ marginTop: 32 }}>
          <ArrowLeft weight="bold" />
          <span>{t("Back")}</span>
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className="profile-page container"
        role="status"
        aria-label={t("Loading profile")}
      >
        <SkeletonProfile />
      </div>
    );
  }

  const games = Array.isArray(profile.recentGames) ? profile.recentGames : [];

  const achievements = Array.isArray(profile.achievements) ? profile.achievements : [];

  const images = (Array.isArray(gallery?.screenshots) ? gallery.screenshots : [])
    .map(safeImageUrl)
    .filter(Boolean);

  const avatar = safeImageUrl(profile.avatarUrl);
  const website = safeHttpsUrl(profile.websiteUrl);
  const createdAt = profile.createdAt ? new Date(profile.createdAt) : null;

  return (
    <div className="profile-page container">
      <Link to="/" className="back-link">
        <ArrowLeft weight="bold" />
        <span>{t("Back")}</span>
      </Link>
      <header className="profile-page__hero">
        <div className="profile-page__avatar">
          {avatar && !avatarFailed ? (
            <img src={avatar} alt="" onError={() => setAvatarFailed(true)} />
          ) : (
            profile.username.slice(0, 1).toUpperCase()
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: 36,
              lineHeight: "36px",
              margin: "0 0 20px",
              overflowWrap: "anywhere",
            }}
          >
            @{profile.username}
          </h1>

          <p
            style={{
              fontSize: 16,
              lineHeight: "20px",
              margin: "0 0 12px",
              whiteSpace: "pre-line",
              overflowWrap: "anywhere",
            }}
          >
            {profile.bio || t("No bio yet.")}
          </p>

          <div className="profile-page__facts">
            {createdAt && !Number.isNaN(createdAt.getTime()) && (
              <span>
                {t("Member since")} {createdAt.toLocaleDateString(language)}
              </span>
            )}

            {profile.location && <span>{profile.location}</span>}

            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {t("Website ")}
                <ArrowUpRight size={14} weight="bold" />
              </a>
            )}
          </div>
        </div>
      </header>

      <section aria-label={t("Recently played")}>
        {games.length ? (
          <div className="game-grid">
            {games.map((game) => {
              const purchase = safeItchUrl(game.purchaseUrl);
              const screenshots = (
                Array.isArray(game.screenshots) ? game.screenshots : []
              )
                .map(safeImageUrl)
                .filter(Boolean);

              const gamePath = `/games/${encodeURIComponent(game.slug)}`;

              return (
                <article className="game-card" key={game.id}>
                  <Link
                    to={gamePath}
                    className="game-card__image-wrap"
                    style={{ display: "block" }}
                    aria-label={`${t("View game")}: ${game.title}`}
                  >
                    <img
                      className="game-card__image"
                      src={
                        safeImageUrl(storeCovers[String(game.id ?? game.slug)]) ||
                        safeImageUrl(game.coverImage || game.cover_image) ||
                        safeImageUrl(game.heroImage || game.hero_image) ||
                        PLACEHOLDER
                      }
                      alt=""
                      loading="lazy"
                      style={{ display: "block" }}
                    />
                  </Link>

                  <h3
                    className="game-card__title"
                    style={{
                      fontSize: 28,
                      lineHeight: "28px",
                      margin: "0 0 12px",
                      overflowWrap: "anywhere",
                    }}
                  >
                    <Link to={gamePath}>{game.title}</Link>
                  </h3>

                  {game.totalMs != null && game.sessions != null && (
                    <p
                      className="game-card__meta"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 6,
                        margin: 0,
                        fontSize: 16,
                        lineHeight: "16px",
                      }}
                    >
                      <Clock size={14} weight="bold" />
                      <span>
                        {duration(game.totalMs)} · {game.sessions}
                        {t(" sessions")}
                      </span>
                    </p>
                  )}

                  {(purchase || screenshots.length > 0) && (
                    <div className="profile-game-actions" style={{ marginTop: 20 }}>
                      {purchase && (
                        <a
                          href={purchase}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--secondary"
                        >
                          <ShoppingCart size={16} weight="bold" />
                          {t("Buy")}
                        </a>
                      )}

                      {screenshots.length > 0 && (
                        <button
                          type="button"
                          className="btn btn--secondary"
                          onClick={() => {
                            setGallery({
                              title: game.title,
                              screenshots,
                            });
                            setSelected(null);
                          }}
                        >
                          <Images size={16} weight="bold" />
                          {t("Screenshots")}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="profile-empty">{t("No public play activity yet.")}</div>
        )}
      </section>

      <section className="profile-section">
        <div className="profile-section__head">
          <div>
            <Trophy size={23} weight="bold" />
            <h2>{t("Achievements")}</h2>
          </div>
          <span>
            {achievements.length}
            {t(" unlocked")}
          </span>
        </div>

        {achievements.length ? (
          <div className="profile-achievements">
            {achievements.map((item) => (
              <article key={`${item.gameSlug}-${item.key}`}>
                <Trophy size={22} weight="bold" style={{ flexShrink: 0 }} />
                <div
                  style={{
                    minWidth: 0,
                    overflowWrap: "anywhere",
                  }}
                >
                  <strong>{item.title}</strong>
                  <span>
                    {item.gameTitle} · {item.points}
                    {t(" points")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-empty">{t("No achievements unlocked yet.")}</div>
        )}
      </section>

      <Modal
        open={Boolean(gallery) && selected === null}
        onClose={closeGallery}
        labelledBy="profile-gallery-title"
      >
        <div className="profile-gallery">
          <div className="profile-section__head" style={{ display: "flex" }}>
            <h2 id="profile-gallery-title">
              {gallery?.title}
              {t(" screenshots")}
            </h2>

            <button
              type="button"
              className="btn btn--secondary"
              style={{ padding: 12, flexShrink: 0 }}
              onClick={closeGallery}
              aria-label={t("Close")}
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <div>
            {images.map((src, index) => (
              <button
                type="button"
                className="game-details__screenshot-item"
                key={`${src}-${index}`}
                onClick={() => setSelected(index)}
                aria-label={t("Open screenshot {0}", {
                  0: index + 1,
                })}
              >
                <img
                  src={src}
                  alt={t("Screenshot {0}", {
                    0: index + 1,
                  })}
                  loading="lazy"
                  style={{
                    display: "block",
                    width: "100%",
                    aspectRatio: "16/9",
                    objectFit: "cover",
                    borderRadius: 10,
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Lightbox
        images={images}
        selectedIndex={selected}
        onClose={() => setSelected(null)}
        onPrev={() =>
          setSelected((index) =>
            index === null || !images.length
              ? null
              : (index - 1 + images.length) % images.length,
          )
        }
        onNext={() =>
          setSelected((index) =>
            index === null || !images.length ? null : (index + 1) % images.length,
          )
        }
      />
    </div>
  );
}
