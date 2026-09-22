import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useGames } from "../hooks/useGames";
import { useContent } from "../hooks/useContent";
import { safeImageUrl, safeHttpsUrl, safeYoutubeEmbedUrl } from "../utils/urls";
import { Modal } from "../components/ui/Modal";
import { Play, ArrowDown, X } from "@phosphor-icons/react";
import { Reveal } from "../components/ui/Reveal";

function ContentState({ resource, empty, children }) {
  if (resource.status === "loading")
    return (
      <p role="status" className="content-state">
        Loading…
      </p>
    );
  if (resource.status === "error")
    return (
      <div className="content-state" role="alert">
        <p>{resource.error}</p>
        <button onClick={resource.retry}>Try again</button>
      </div>
    );
  return children || <p className="content-state">{empty}</p>;
}

export function Home() {
  const catalog = useGames({ limit: 8 });
  const news = useContent("/news", { limit: 3 });
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
  const detail = useContent(
    selected ? `/videos/${encodeURIComponent(selected)}` : null,
  );
  const active = detail.status === "success" ? detail.data : null;
  const embed = safeYoutubeEmbedUrl(active?.video_url);
  const external = safeHttpsUrl(active?.video_url);
  const games = catalog.games || [];
  const featured = games.find((game) => game.featured) || games[0];
  function closeVideo() {
    const next = new URLSearchParams(params);
    next.delete("video");
    setParams(next, { replace: true, preventScrollReset: true });
  }
  return (
    <div className="home">
      <section
        id="home"
        className="full-page landing-page studio-landing"
      >
                <div className="container" style={{ zIndex: 10 }}>
                    <Reveal>
                            <img src="/assets/branding/typo.svg" className="hero-logo" alt="Deadsmile Games logo" style={{ width: "100%", maxWidth: "1000px", margin: "0 auto", objectFit: "contain" }} />
                    </Reveal>
                </div>
        <a href="#games" className="landing-next">
          Discover our games <ArrowDown size={18} />
        </a>
      </section>
      <section id="games" className="full-page-mh studio-games">
        <div className="container">
          <ContentState
            resource={catalog}
            empty="Our next challenge is on its way."
          >
            {featured && (
              <>
                <div className="game-spotlight">
                  <div>
                    <h2>{featured.title}</h2>
                    <p>{featured.shortDescription}</p>
                    <div className="studio-actions">
                      <Link
                        className="btn btn--primary"
                        to={`/games/${featured.slug}`}
                      >
                        Explore game
                      </Link>
                      <a
                        className="btn btn--primary"
                        href="#videos"
                      >
                        <Play size={20} /> Trailers
                      </a>
                    </div>
                  </div>
                  <Link
                    to={`/games/${featured.slug}`}
                    className="spotlight-art"
                  >
                    <img
                      src={
                        safeImageUrl(
                          featured.heroImage ||
                          featured.coverImage,
                        ) ||
                        "/assets/placeholders/game-cover.svg"
                      }
                      alt={featured.title}
                    />
                  </Link>
                </div>
                {games.length > 1 && (
                  <div className="studio-game-strip">
                    {games
                      .filter((g) => g.id !== featured.id)
                      .map((game) => (
                        <Link
                          key={game.id}
                          to={`/games/${game.slug}`}
                        >
                          <img
                            src={
                              safeImageUrl(
                                game.coverImage,
                              ) ||
                              "/assets/placeholders/game-cover.svg"
                            }
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
          <Link className="btn btn--primary" to="/games">
            See all games →
          </Link>
        </div>
      </section>
      <section id="videos" className="studio-section studio-videos">
        <div className="container">
          <header className="section-heading">
            <h2>From the games</h2>
            <p>Trailers, gameplay and a look behind the scenes.</p>
          </header>
          <ContentState
            resource={videos}
            empty="New videos are coming soon."
          >
            {videos.data?.length > 0 && (
              <div className="video-grid">
                {videos.data.map((video) => (
                  <button
                    className="video-tile"
                    key={video.id}
                    onClick={() => {
                      const next = new URLSearchParams(
                        params,
                      );
                      next.set("video", video.id);
                      setParams(next, {
                        preventScrollReset: true,
                      });
                    }}
                  >
                    <span className="video-visual">
                      {safeImageUrl(video.thumbnail) && (
                        <img
                          src={safeImageUrl(
                            video.thumbnail,
                          )}
                          alt=""
                          loading="lazy"
                        />
                      )}
                      <span className="play-button">
                        <Play size={26} weight="fill" />
                      </span>
                    </span>
                    <span className="eyebrow">
                      {video.category || "Video"}
                    </span>
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
            <h2>Latest from the studio</h2>
            <Link className="btn btn--primary" to="/news">
              All news →
            </Link>
          </header>
          <ContentState resource={news} empty="No announcements yet.">
            {news.data?.length > 0 && (
              <div className="news-grid">
                {news.data.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.slug}`}
                    className="news-tile"
                  >
                    {safeImageUrl(item.image) && (
                      <img
                        src={safeImageUrl(item.image)}
                        alt=""
                        loading="lazy"
                      />
                    )}
                    <small>{item.category || "News"}</small>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <span className="btn btn--primary">
                      Read story →
                    </span>
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
            <h2 className="heading-3">A little about us</h2>
            <p className="paragraph-3">
              We make games that push your limits.
              <br />
              The kind that make you fail, laugh, and try again.
            </p>
            <p className="paragraph-3">
              Every world starts with an idea.
              <br />
              Every challenge is better with you in it.
            </p>
            <Link to="/about" className="btn btn--secondary">
              Meet Deadsmile Games →
            </Link>
          </div>
        </div>
      </section>
      <Modal
        open={Boolean(selected)}
        onClose={closeVideo}
        labelledBy="video-title"
      >
        <div className="video-dialog">
          <button
            className="dialog-close"
            onClick={closeVideo}
            aria-label="Close video"
          >
            <X />
          </button>
          <h2 id="video-title">{active?.title || "Video"}</h2>
          <ContentState resource={detail} empty="Video unavailable.">
            {active && (
              <>
                {embed ? (
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
                    Open video
                  </a>
                ) : (
                  <p>No video source available.</p>
                )}
              </>
            )}
          </ContentState>
        </div>
      </Modal>
    </div>
  );
}
