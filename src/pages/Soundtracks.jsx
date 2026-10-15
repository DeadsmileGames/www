import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import {
  ArrowUpRight,
  MusicNotes,
  Play,
  X,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../hooks/useContent";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonVideos } from "../components/ui/Skeleton";
import { setOptionalContent, useOptionalContent } from "../utils/consent";
import { trapFocus } from "../utils/dom";
import { safeHttpsUrl, safeImageUrl, safeYoutubeEmbedUrl } from "../utils/urls";

function publishedLabel(value, language) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toLocaleDateString(language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function SoundtrackPlayerPanel({ track, game, onClose, onSelect }) {
  const { t, language } = useLanguage();
  const allowed = useOptionalContent();
  const reducedMotion = useReducedMotion();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  const [playing, setPlaying] = useState(false);
  closeRef.current = onClose;

  useEffect(() => {
    if (!track) return undefined;
    return trapFocus(panelRef.current, () => closeRef.current());
  }, [track?.id]);

  const embed = safeYoutubeEmbedUrl(track?.watchUrl);
  const external = safeHttpsUrl(track?.watchUrl);
  const thumbnail = safeImageUrl(track?.thumbnail) || safeImageUrl(game?.coverImage);
  const published = publishedLabel(track?.publishedAt, language);
  const playerLanguage = ["en", "es", "pt-BR"].includes(language) ? language : "en";
  const embedSrc = (() => {
    if (!embed || !playing || !allowed) return null;
    const url = new URL(embed);
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("rel", "0");
    url.searchParams.set("hl", playerLanguage);
    url.searchParams.set("cc_lang_pref", playerLanguage === "pt-BR" ? "pt" : playerLanguage);
    return url.toString();
  })();
  const related = (game?.videos || []).filter((item) => item.id !== track.id).slice(0, 4);

  return createPortal(
    <AnimatePresence>
      {track && (
        <m.div
          key={track.id}
          className="video-overlay soundtrack-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="soundtrack-overlay-title"
          tabIndex={-1}
          ref={panelRef}
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: reducedMotion ? 0.01 : 0.42, ease: "easeInOut" }}
        >
          {thumbnail && <img className="video-overlay__background" src={thumbnail} alt="" />}
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label={t("Close video")}
          >
            <X weight="bold" />
          </button>

          <div className="video-overlay__content soundtrack-overlay__content">
            <div className="soundtrack-overlay__eyebrow">
              <MusicNotes size={16} weight="fill" />
              <span>{t("Soundtracks")}</span>
              {game?.slug && (
                <>
                  <span aria-hidden="true">/</span>
                  <Link to={`/games/${encodeURIComponent(game.slug)}`} onClick={onClose}>
                    {game.title}
                  </Link>
                </>
              )}
            </div>

            <div className="video-dialog video-overlay__player soundtrack-overlay__player">
              {embed && !allowed ? (
                <div className="soundtrack-overlay__consent">
                  <MusicNotes size={30} />
                  <p>{t("Allow YouTube content to play this video.")}</p>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => {
                      setOptionalContent(true);
                      setPlaying(true);
                    }}
                  >
                    <YoutubeLogo size={20} weight="fill" />
                    {t("Allow YouTube")}
                  </button>
                </div>
              ) : embedSrc ? (
                <iframe
                  src={embedSrc}
                  title={track.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : embed && allowed ? (
                <button
                  type="button"
                  className="soundtrack-overlay__poster"
                  onClick={() => setPlaying(true)}
                  aria-label={t("Play soundtrack")}
                >
                  {thumbnail && <img src={thumbnail} alt="" />}
                  <span className="soundtrack-overlay__poster-play">
                    <Play size={29} weight="fill" />
                  </span>
                </button>
              ) : external ? (
                <a
                  className="soundtrack-overlay__poster"
                  href={external}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("Open on YouTube")}
                >
                  {thumbnail && <img src={thumbnail} alt="" />}
                  <span className="soundtrack-overlay__poster-play">
                    <Play size={29} weight="fill" />
                  </span>
                </a>
              ) : (
                <p className="content-state">{t("No video source available.")}</p>
              )}
            </div>

            <div className="video-overlay__details">
              <div className="video-overlay__heading">
                <div className="video-overlay__heading-copy">
                  <h1 id="soundtrack-overlay-title">{track.title}</h1>
                  <div className="soundtrack-overlay__metadata">
                    {game?.title && <span>{game.title}</span>}
                    {track.channelTitle && <span>{track.channelTitle}</span>}
                    {published && <time dateTime={track.publishedAt}>{published}</time>}
                  </div>
                </div>
                {external && (
                  <a
                    className="btn btn--secondary soundtrack-overlay__youtube"
                    href={external}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <YoutubeLogo size={20} weight="fill" />
                    {t("Open on YouTube")}
                    <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
            </div>

            {track.description && (
              <section
                className="video-overlay__description-panel support-card"
                aria-labelledby="soundtrack-overlay-description"
              >
                <h2 id="soundtrack-overlay-description">{t("Description")}</h2>
                <p className="video-overlay__description">{track.description}</p>
              </section>
            )}

            {related.length > 0 && (
              <section className="video-overlay__related" aria-labelledby="soundtrack-related-title">
                <h2 id="soundtrack-related-title">{t("More from this game")}</h2>
                <div className="video-overlay__related-grid">
                  {related.map((item, index) => {
                    const image = safeImageUrl(item.thumbnail);
                    return (
                      <m.button
                        key={item.id}
                        type="button"
                        className="video-overlay__related-tile"
                        onClick={() => onSelect(item.id)}
                        whileHover={reducedMotion ? undefined : { y: -3 }}
                        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
                        initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reducedMotion ? 0.01 : 0.24, delay: index * 0.035 }}
                      >
                        <span className="video-overlay__related-visual">
                          {image && <img src={image} alt="" loading="lazy" />}
                          <span className="video-overlay__related-play" aria-hidden="true">
                            <Play size={21} weight="fill" />
                          </span>
                        </span>
                        <span className="video-overlay__related-title">{item.title}</span>
                      </m.button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Soundtracks() {
  const { t, language } = useLanguage();
  const resource = useContent("/soundtracks", {});
  const [search, setSearch] = useState("");
  const [params, setParams] = useSearchParams();

  const groups = Array.isArray(resource.data?.groups) ? resource.data.groups : [];
  const total = Number.isFinite(resource.data?.total) ? resource.data.total : 0;
  const trackId = params.get("track");
  const tracks = useMemo(() => groups.flatMap((group) =>
    (group.videos || []).map((track) => ({ ...track, gameId: group.gameId })),
  ), [groups]);
  const selectedTrack = tracks.find((track) => String(track.id) === String(trackId)) || null;
  const selectedGroup = selectedTrack
    ? groups.find((group) => String(group.gameId) === String(selectedTrack.gameId)) || null
    : null;

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return groups;
    return groups
      .map((group) => {
        if (group.title.toLocaleLowerCase().includes(term)) return group;
        return {
          ...group,
          videos: (group.videos || []).filter((track) =>
            [track.title, track.description, track.channelTitle]
              .filter(Boolean)
              .some((value) => value.toLocaleLowerCase().includes(term)),
          ),
        };
      })
      .filter((group) => group.videos.length > 0);
  }, [groups, search]);

  const filteredCount = filteredGroups.reduce((count, group) => count + group.videos.length, 0);

  function openTrack(id) {
    const next = new URLSearchParams(params);
    next.set("track", id);
    setParams(next, { preventScrollReset: true });
  }

  function closeTrack() {
    const next = new URLSearchParams(params);
    next.delete("track");
    setParams(next, { replace: true, preventScrollReset: true });
  }

  const isLoading = resource.status === "idle" || resource.status === "loading";

  return (
    <div className="videos-page">
      <section className="studio-section studio-videos">
        <div className="container">
          <header className="section-heading">
            <h2>{t("From the games")}</h2>
            <p>
              {t("{0} soundtracks", { 0: total })}
              {" · "}
              {t("Browse soundtracks from Deadsmile Games, organized by game.")}
            </p>
          </header>

          <label className="search-page__input-wrapper">
            <span className="sr-only">{t("Search soundtracks or games")}</span>
            <input
              className="search-page__input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("Search soundtracks or games")}
            />
          </label>
          {resource.status === "success" && (
            <p className="search-page__hint">
              {t("{0} soundtracks found", { 0: filteredCount })}
            </p>
          )}

          {isLoading && (
            <div role="status" aria-label={t("Loading")} className="content-state">
              <SkeletonVideos />
            </div>
          )}
          {resource.status === "error" && (
            <div className="content-state" role="alert">
              <ErrorState message={resource.error} onRetry={resource.retry} />
            </div>
          )}
          {resource.status === "success" && groups.length === 0 && (
            <EmptyState
              title={t("No soundtracks found")}
              message={t("There are no matching YouTube soundtracks for the games in our catalog right now.")}
            />
          )}
          {resource.status === "success" && groups.length > 0 && filteredGroups.length === 0 && (
            <EmptyState
              title={t("No soundtracks found")}
              message={t("Try another game or soundtrack title.")}
            />
          )}

          {resource.status === "success" && filteredGroups.map((group, groupIndex) => (
            <section
              className={groupIndex === 0 ? "studio-videos" : "studio-section studio-videos"}
              key={group.gameId}
            >
              <header className="section-heading">
                <h2>{group.title}</h2>
                <p>{t("{0} soundtracks", { 0: group.videos.length })}</p>
                {group.slug && (
                  <Link className="text-link" to={"/games/" + encodeURIComponent(group.slug)}>
                    {t("View game")}
                  </Link>
                )}
              </header>
              <div className="video-grid">
                {group.videos.map((track) => {
                  const image = safeImageUrl(track.thumbnail);
                  const published = publishedLabel(track.publishedAt, language);
                  const selected = String(selectedTrack?.id) === String(track.id);
                  return (
                    <button
                      type="button"
                      className="video-tile"
                      key={track.id}
                      onClick={() => openTrack(track.id)}
                      aria-label={t("Play soundtrack") + ": " + track.title}
                      aria-pressed={selected}
                    >
                      <span className="video-visual">
                        {image ? (
                          <img src={image} alt="" loading="lazy" />
                        ) : (
                          <span className="videos-page__preview-placeholder">{t("Play soundtrack")}</span>
                        )}
                        <span className="play-button" aria-hidden="true">
                          <Play size={26} weight="fill" />
                        </span>
                      </span>
                      <h3>{track.title}</h3>
                      <small>{published || track.channelTitle || t("From YouTube")}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <SoundtrackPlayerPanel
        track={selectedTrack}
        game={selectedGroup}
        onClose={closeTrack}
        onSelect={openTrack}
      />
    </div>
  );
}
