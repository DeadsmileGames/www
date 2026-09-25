import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useGames } from "../hooks/useGames";
import { useContent } from "../hooks/useContent";
import { safeImageUrl, safeHttpsUrl, safeYoutubeEmbedUrl } from "../utils/urls";
import { Modal } from "../components/ui/Modal";
import { Play, ArrowDown, X } from "@phosphor-icons/react";
import { Reveal } from "../components/ui/Reveal";

function ContentState({ resource, empty, children }) {
  if (resource.status === "loading") {
    return <p role="status" className="content-state">Loading…</p>;
  }
  if (resource.status === "error") {
    return (
      <div className="content-state" role="alert">
        <p>{resource.error}</p>
        <button type="button" onClick={resource.retry}>Try again</button>
      </div>
    );
  }
  return children || <p className="content-state">{empty}</p>;
}

// /videos já vem da API em ordem de published_at DESC.
// Consideramos apenas trailers oficiais cadastrados na página de vídeos.
function isGameTrailer(video, games) {
  if (!video || !safeYoutubeEmbedUrl(video.video_url)) return false;
  const category = String(video.category || "");
  const title = String(video.title || "");
  if (!/\btrailer\b/i.test(`${category} ${title}`)) return false;

  return Boolean(
    video.game_id ||
    video.game_slug ||
    /\btrailer\b/i.test(category) ||
    games.some((game) =>
      game.title && title.toLowerCase().includes(game.title.toLowerCase()),
    ),
  );
}

export function Home() {
  const catalog = useGames({ limit: 8 });
  const news = useContent("/news", { limit: 3 });
  const videos = useContent("/videos", { limit: 48 });
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [allowBackgroundVideo, setAllowBackgroundVideo] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const update = () => setAllowBackgroundVideo(!preference.matches && !connection?.saveData);
    update();
    preference.addEventListener?.("change", update);
    connection?.addEventListener?.("change", update);
    return () => {
      preference.removeEventListener?.("change", update);
      connection?.removeEventListener?.("change", update);
    };
  }, []);

  function setParams(next, { hash = location.hash || "#videos", ...options } = {}) {
    navigate(
      { pathname: "/", search: next.toString(), hash },
      { preventScrollReset: true, ...options },
    );
  }

  const selected = params.get("video");
  const detail = useContent(
    selected ? `/videos/${encodeURIComponent(selected)}` : null,
  );
  const active = detail.status === "success" ? detail.data : null;
  const embed = safeYoutubeEmbedUrl(active?.video_url);
  const external = safeHttpsUrl(active?.video_url);

  const games = catalog.games || [];
  const featured = games.find((game) => game.featured) || games[0];
  const availableVideos = Array.isArray(videos.data) ? videos.data : [];
  const latestTrailer = availableVideos.find((video) => isGameTrailer(video, games));
  const trailerEmbed = safeYoutubeEmbedUrl(latestTrailer?.video_url);
  const trailerId = trailerEmbed?.split("/").pop();
  const heroVideoSrc = trailerEmbed && trailerId
    ? `${trailerEmbed}?autoplay=1&mute=1&controls=0&loop=1&playlist=${encodeURIComponent(trailerId)}&playsinline=1&rel=0`
    : null;

  const trailerGame = latestTrailer
    ? games.find((game) =>
        game.id === latestTrailer.game_id || game.slug === latestTrailer.game_slug,
      ) || (latestTrailer.game_slug
        ? { slug: latestTrailer.game_slug, title: latestTrailer.game_title }
        : null)
    : null;
  const heroGame = latestTrailer ? trailerGame : featured;
  const heroPoster = safeImageUrl(latestTrailer?.thumbnail) ||
    safeImageUrl(featured?.heroImage || featured?.coverImage) ||
    "/assets/games/screenshots/abbys-restless-heart/4.png";

  function openVideo(videoId, hash = "#videos") {
    if (!videoId) return;
    const next = new URLSearchParams(params);
    next.set("video", videoId);
    setParams(next, { hash });
  }

  function closeVideo() {
    const next = new URLSearchParams(params);
    next.delete("video");
    setParams(next, { replace: true });
  }

  return (
    <div className="home">
      <section id="home" className="full-page landing-page studio-landing home-hero">
        <div className="home-hero__media" aria-hidden="true">
          <div
            className="home-hero__poster"
            style={{ backgroundImage: `url(${JSON.stringify(heroPoster)})` }}
          />
          {allowBackgroundVideo && heroVideoSrc && !selected && (
            <iframe
              className="home-hero__video"
              src={heroVideoSrc}
              title="Latest Deadsmile Games trailer background"
              tabIndex={-1}
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
          <div className="home-hero__shade" />
        </div>

        <div className="container home-hero__content">
          <Reveal>
            <h1>{latestTrailer?.game_title || heroGame?.title || "Welcome to Deadsmile Games"}</h1>
            <p className="home-hero__description">
              {latestTrailer
                ? latestTrailer.title
                : "Discover our games, watch the latest trailers and see what is new at the studio."}
            </p>
            <div className="studio-actions home-hero__actions">
              {latestTrailer && (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => openVideo(latestTrailer.id, "#home")}
                >
                  <Play size={20} weight="fill" /> Watch latest trailer
                </button>
              )}
              {heroGame?.slug ? (
                <Link className="btn btn--secondary" to={`/games/${heroGame.slug}`}>
                  Explore game →
                </Link>
              ) : (
                <Link className="btn btn--secondary" to="/games">
                  Explore our games →
                </Link>
              )}
            </div>
          </Reveal>
        </div>

        <a href="#games" className="landing-next home-hero__next">
          Discover our games <ArrowDown size={18} />
        </a>
      </section>

      <section id="games" className="full-page-mh studio-games home-section">
        <div className="container">
          <header className="section-heading home-section__heading">
            <div>
              <h2>Our games</h2>
              <p>Find your next challenge.</p>
            </div>
            <Link className="btn btn--primary" to="/games">See all games →</Link>
          </header>
          <ContentState resource={catalog} empty="Our next challenge is on its way.">
            {featured && (
              <>
                <div className="game-spotlight">
                  <div>
                    <h3>{featured.title}</h3>
                    <p>{featured.shortDescription}</p>
                    <div className="studio-actions">
                      <Link className="btn btn--primary" to={`/games/${featured.slug}`}>
                        Explore game →
                      </Link>
                      <a className="btn btn--secondary" href="#videos">
                        <Play size={20} /> Watch trailers
                      </a>
                    </div>
                  </div>
                  <Link to={`/games/${featured.slug}`} className="spotlight-art">
                    <img
                      src={safeImageUrl(featured.heroImage || featured.coverImage) ||
                        "/assets/placeholders/game-cover.svg"}
                      alt={featured.title}
                    />
                  </Link>
                </div>
                {games.length > 1 && (
                  <div className="studio-game-strip">
                    {games.filter((game) => game.id !== featured.id).slice(0, 6).map((game) => (
                      <Link key={game.id} to={`/games/${game.slug}`}>
                        <img
                          src={safeImageUrl(game.coverImage) ||
                            "/assets/placeholders/game-cover.svg"}
                          alt=""
                          loading="lazy"
                        />
                        <h3>{game.title}</h3>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </ContentState>
        </div>
      </section>

      <section id="videos" className="studio-section studio-videos home-section">
        <div className="container">
          <header className="section-heading home-section__heading">
            <div>
              <h2>From the games</h2>
              <p>Trailers, gameplay and a look behind the scenes.</p>
            </div>
          </header>
          <ContentState resource={videos} empty="New videos are coming soon.">
            {availableVideos.length > 0 && (
              <div className="video-grid">
                {availableVideos.slice(0, 3).map((video) => (
                  <button
                    type="button"
                    className="video-tile"
                    key={video.id}
                    onClick={() => openVideo(video.id)}
                  >
                    <span className="video-visual">
                      {safeImageUrl(video.thumbnail) && (
                        <img src={safeImageUrl(video.thumbnail)} alt="" loading="lazy" />
                      )}
                      <span className="play-button"><Play size={26} weight="fill" /></span>
                    </span>
                    <h3>{video.title}</h3>
                  </button>
                ))}
              </div>
            )}
          </ContentState>
        </div>
      </section>

      <section className="studio-section studio-news home-section">
        <div className="container">
          <header className="section-heading home-section__heading">
            <div>
              <h2>Latest from the studio</h2>
              <p>Updates, announcements and what is coming next.</p>
            </div>
            <Link className="btn btn--primary" to="/news">All news →</Link>
          </header>
          <ContentState resource={news} empty="No announcements yet.">
            {news.data?.length > 0 && (
              <div className="news-grid">
                {news.data.map((item) => (
                  <Link key={item.id} to={`/news/${item.slug}`} className="news-tile">
                    {safeImageUrl(item.image) && (
                      <img src={safeImageUrl(item.image)} alt="" loading="lazy" />
                    )}
                    <small>{item.category || "News"}</small>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <span className="btn btn--primary">Read story →</span>
                  </Link>
                ))}
              </div>
            )}
          </ContentState>
        </div>
      </section>

      <section id="about" className="full-page-about studio-about home-section">
        <div className="sec-about">
          <div className="div-about-us">
            <h2 className="heading-3">A little about us</h2>
            <p className="paragraph-3">
              We make games that push your limits.<br />
              The kind that make you fail, laugh, and try again.
            </p>
            <p className="paragraph-3">
              Every world starts with an idea.<br />
              Every challenge is better with you in it.
            </p>
            <Link to="/about" className="btn btn--primary">Meet Deadsmile Games →</Link>
          </div>
        </div>
      </section>

      <Modal open={Boolean(selected)} onClose={closeVideo} labelledBy="video-title">
        <div className="video-dialog">
          <button type="button" className="dialog-close" onClick={closeVideo} aria-label="Close video">
            <X />
          </button>
          <h2 id="video-title">{active?.title || "Video"}</h2>
          <ContentState resource={detail} empty="Video unavailable.">
            {active && (
              embed ? (
                <iframe
                  src={embed}
                  title={active.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : external ? (
                <a className="btn" href={external} target="_blank" rel="noopener noreferrer">
                  Open video
                </a>
              ) : (
                <p>No video source available.</p>
              )
            )}
          </ContentState>
        </div>
      </Modal>
    </div>
  );
}
