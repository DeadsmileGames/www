import { useLanguage } from "../context/LanguageContext";
import { FeaturedHero, isAbby, ABBY_VIDEO_ID } from "../components/games/FeaturedHero";
import { Skeleton, SkeletonVideos, SkeletonNews } from "../components/ui/Skeleton";
import { Link, useNavigate } from "react-router-dom";
import { useGames } from "../hooks/useGames";
import { useContent } from "../hooks/useContent";
import { safeImageUrl, safeHttpsUrl, safeYoutubeEmbedUrl } from "../utils/urls";
import { getVideoThumbnail } from "../utils/videoThumbnail";
import { Play } from "@phosphor-icons/react";
import { AutoLinkText } from "../components/ui/AutoLinkText";

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
  const { t, language } = useLanguage();
  const catalog = useGames({ limit: 8 });
  const news = useContent("/newswire", { limit: 3 });
  const videos = useContent("/videos", { limit: 48 });
  const navigate = useNavigate();
  const games = catalog.games || [];
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
    const trailerUrl =
      safeHttpsUrl(game.trailerUrl) ||
      (isAbby(game) ? `https://youtu.be/${ABBY_VIDEO_ID}` : null);
    const trailerEmbed = safeYoutubeEmbedUrl(trailerUrl);
    const matchingVideo =
      videos.data?.find(
        (video) =>
          trailerEmbed && safeYoutubeEmbedUrl(video.video_url) === trailerEmbed,
      ) ||
      videos.data?.find(
        (video) =>
          video.game_id === game.id &&
          String(video.category).toLowerCase() === "trailer",
      );

    navigate(
      matchingVideo
        ? `/videos?video=${encodeURIComponent(matchingVideo.id)}`
        : "/videos",
    );
  }
  return (
    <div className="home">
      <FeaturedHero
        games={heroGames}
        status={catalog.status}
        error={catalog.error}
        onRetry={catalog.retry}
        onTrailer={openHeroTrailer}
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
                    type="button"
                    onClick={() =>
                      navigate(`/videos?video=${encodeURIComponent(video.id)}`)
                    }
                  >
                    <span className="video-visual">
                      {getVideoThumbnail(video, language) && (
                        <img src={getVideoThumbnail(video, language)} alt="" loading="lazy" />
                      )}
                      <span className="play-button">
                        <Play size={26} weight="fill" />
                      </span>
                    </span>
                    <h3>{video.youtube?.title || video.title}</h3>
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
                    <p><AutoLinkText>{item.excerpt}</AutoLinkText></p>
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
    </div>
  );
}
