import { useLanguage } from "../context/LanguageContext";
import { useState } from "react";
import { FeaturedHero, isAbby, ABBY_VIDEO_ID } from "../components/games/FeaturedHero";
import { Skeleton, SkeletonVideos, SkeletonNews } from "../components/ui/Skeleton";
import { useOptionalContent, setOptionalContent } from "../utils/consent";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useGames } from "../hooks/useGames";
import { useContent } from "../hooks/useContent";
import { safeImageUrl, safeHttpsUrl, safeYoutubeEmbedUrl } from "../utils/urls";
import { Modal } from "../components/ui/Modal";
import { Play, X } from "@phosphor-icons/react";

function ContentState({ resource, empty, children, skeleton }) {
  const { t } = useLanguage();
  if (resource.status === "loading")
    return (
      <div role="status" aria-label={t("Loading")} className="content-state">
        {skeleton || <Skeleton style={{ aspectRatio: "16/9", width: "100%" }} />}
      </div>
    );

  if (resource.status === "error")
    return (
      <div className="content-state" role="alert">
        <p>{resource.error}</p>
        <button onClick={resource.retry}>{t("Try again")}</button>
      </div>
    );

  return children || <p className="content-state">{empty}</p>;
}

export function Home() {
  const { t } = useLanguage();
  const optionalAllowed = useOptionalContent();
  const [heroVideo, setHeroVideo] = useState(null);
  const catalog = useGames({ limit: 8 });
  const news = useContent("/newswire", { limit: 3 });
  const videos = useContent("/videos", { limit: 48 });
  const [params] = useSearchParams();
  const navigate = useNavigate();
  function setParams(next, options = {}) {
    navigate(
      { pathname: "/", search: next.toString(), hash: "#videos" },
      { preventScrollReset: true, ...options },
    );
  }
  const selected = params.get("video");
  const detail = useContent(selected ? `/videos/${encodeURIComponent(selected)}` : null);
  const active = heroVideo || (detail.status === "success" ? detail.data : null);
  const embed = safeYoutubeEmbedUrl(active?.video_url);
  const external = safeHttpsUrl(active?.video_url);
  const games = catalog.games || [];
  const featured = games.find((game) => game.featured) || games[0];
  const heroGames = games.map((game) => ({
    ...game,
    trailerUrl:
      game.trailerUrl ||
      videos.data?.find(
        (video) =>
          video.game_id === game.id && String(video.category).toLowerCase() === "trailer",
      )?.video_url,
  }));
  function openHeroTrailer(game) {
    const url =
      safeHttpsUrl(game.trailerUrl) ||
      (isAbby(game) ? `https://youtu.be/${ABBY_VIDEO_ID}` : null);
    if (url)
      setHeroVideo({ title: t("{0} \u2014 Trailer", { 0: game.title }), video_url: url });
  }
  function closeVideo() {
    setHeroVideo(null);
    if (!selected) return;
    const next = new URLSearchParams(params);
    next.delete("video");
    setParams(next, { replace: true, preventScrollReset: true });
  }
  return (
    <div className="home">
      <FeaturedHero
        games={heroGames}
        status={catalog.status}
        error={catalog.error}
        onRetry={catalog.retry}
        onTrailer={openHeroTrailer}
        suspended={Boolean(selected || heroVideo)}
      />
      <section id="videos" className="studio-section studio-videos">
        <div className="container">
          <header className="section-heading">
            <h2>{t("From the games")}</h2>
            <p>{t("Trailers, gameplay and a look behind the scenes.")}</p>
          </header>
          <ContentState
            resource={videos}
            skeleton={<SkeletonVideos />}
            empty={t("New videos are coming soon.")}
          >
            {videos.data?.length > 0 && (
              <div className="video-grid">
                {videos.data.map((video) => (
                  <button
                    className="video-tile"
                    key={video.id}
                    onClick={() => {
                      const next = new URLSearchParams(params);
                      next.set("video", video.id);
                      setParams(next, {
                        preventScrollReset: true,
                      });
                    }}
                  >
                    <span className="video-visual">
                      {safeImageUrl(video.thumbnail) && (
                        <img src={safeImageUrl(video.thumbnail)} alt="" loading="lazy" />
                      )}
                      <span className="play-button">
                        <Play size={26} weight="fill" />
                      </span>
                    </span>
                    <span className="eyebrow">{video.category || t("Video")}</span>
                    <h3>{video.title}</h3>
                  </button>
                ))}
              </div>
            )}
          </ContentState>
        </div>
      </section>
      <section className="studio-section studio-news">
        <div className="container">
          <header className="section-heading">
            <h2>{t("Latest from the studio")}</h2>
            <Link
              className="btn btn--primary"
              style={{ marginTop: "1rem" }}
              to="/newswire"
            >
              {t("All news \u2192")}
            </Link>
          </header>
          <ContentState
            skeleton={<SkeletonNews tiles />}
            resource={news}
            empty={t("No announcements yet.")}
          >
            {news.data?.length > 0 && (
              <div className="news-grid">
                {news.data.map((item) => (
                  <Link key={item.id} to={`/newswire/${item.slug}`} className="news-tile">
                    {safeImageUrl(item.image) && (
                      <img src={safeImageUrl(item.image)} alt="" loading="lazy" />
                    )}
                    <small>{item.category || t("News")}</small>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <span className="btn btn--primary">{t("Read story \u2192")}</span>
                  </Link>
                ))}
              </div>
            )}
          </ContentState>
        </div>
      </section>
      <section id="about" className="full-page-about studio-about">
        <div className="sec-about">
          <div className="div-about-us">
            <h2 className="heading-3">{t("A little about us")}</h2>
            <p className="paragraph-3">
              {t("We make games that push your limits.")}

              <br />
              {t("The kind that make you fail, laugh, and try again.")}
            </p>
            <p className="paragraph-3">
              {t("Every world starts with an idea.")}

              <br />
              {t("Every challenge is better with you in it.")}
            </p>
            <Link to="/about" className="btn btn--primary">
              {t("Meet Deadsmile Games \u2192")}
            </Link>
          </div>
        </div>
      </section>
      <Modal
        open={Boolean(selected || heroVideo)}
        onClose={closeVideo}
        labelledBy="video-title"
      >
        <div className="video-dialog">
          <button
            className="dialog-close"
            onClick={closeVideo}
            aria-label={t("Close video")}
          >
            <X />
          </button>
          <h2 id="video-title">{active?.title || t("Video")}</h2>
          <ContentState
            resource={heroVideo ? { status: "success" } : detail}
            empty={t("Video unavailable.")}
          >
            {active && (
              <>
                {embed && !optionalAllowed ? (
                  <div className="support-card">
                    <p>{t("Allow YouTube content to play this video.")}</p>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setOptionalContent(true)}
                    >
                      {t("Allow YouTube")}
                    </button>
                  </div>
                ) : embed ? (
                  <iframe
                    src={embed}
                    title={active.title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : external ? (
                  <a
                    className="btn"
                    href={external}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("Open video")}
                  </a>
                ) : (
                  <p>{t("No video source available.")}</p>
                )}
              </>
            )}
          </ContentState>
        </div>
      </Modal>
    </div>
  );
}
