import { useMemo, useState } from "react";
import { ArrowUpRight, Disc, MagnifyingGlass, MusicNotes, Play } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../hooks/useContent";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonVideos } from "../components/ui/Skeleton";
import { safeHttpsUrl, safeImageUrl } from "../utils/urls";

function publishedLabel(value, language) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toLocaleDateString(language, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function SoundtrackCard({ track, language, t }) {
  const image = safeImageUrl(track.thumbnail);
  const url = safeHttpsUrl(track.watchUrl);
  const published = publishedLabel(track.publishedAt, language);

  if (!url) return null;

  return (
    <a
      className="soundtrack-card"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("Listen on YouTube") + ": " + track.title}
    >
      <span className="soundtrack-card__art">
        {image ? <img src={image} alt="" loading="lazy" /> : <span className="soundtrack-card__art-fallback"><MusicNotes size={30} /></span>}
        <span className="soundtrack-card__play" aria-hidden="true"><Play size={22} weight="fill" /></span>
      </span>
      <span className="soundtrack-card__body">
        <strong className="soundtrack-card__title">{track.title}</strong>
        <span className="soundtrack-card__channel">{track.channelTitle}</span>
        <span className="soundtrack-card__footer">
          <span>{published || t("From YouTube")}</span>
          <span className="soundtrack-card__listen">{t("Listen on YouTube")} <ArrowUpRight size={15} weight="bold" /></span>
        </span>
      </span>
    </a>
  );
}

export function Soundtracks() {
  const { t, language } = useLanguage();
  const content = useContent("/soundtracks", {});
  const [search, setSearch] = useState("");

  const groups = Array.isArray(content.data?.groups) ? content.data.groups : [];
  const total = Number.isFinite(content.data?.total) ? content.data.total : 0;
  const featuredGroup = groups[0] || null;
  const featuredTrack = featuredGroup?.videos?.[0] || null;
  const featuredImage = safeImageUrl(featuredTrack?.thumbnail || featuredGroup?.coverImage);
  const featuredUrl = safeHttpsUrl(featuredTrack?.watchUrl);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return groups;
    return groups
      .map((group) => {
        const gameMatches = group.title.toLocaleLowerCase().includes(term);
        return {
          ...group,
          videos: gameMatches
            ? group.videos
            : (group.videos || []).filter((track) =>
                [track.title, track.description, track.channelTitle]
                  .filter(Boolean)
                  .some((value) => value.toLocaleLowerCase().includes(term)),
              ),
        };
      })
      .filter((group) => group.videos.length > 0);
  }, [groups, search]);

  const filteredCount = filteredGroups.reduce((count, group) => count + group.videos.length, 0);

  return (
    <div className="soundtracks-page">
      <header className="soundtracks-hero">
        {featuredImage && <img className="soundtracks-hero__background" src={featuredImage} alt="" />}
        <div className="soundtracks-hero__shade" />
        <div className="container soundtracks-hero__layout">
          <div className="soundtracks-hero__copy">
            <p className="soundtracks-eyebrow"><MusicNotes size={17} weight="fill" /> {t("Original game music")}</p>
            <h1>{t("Soundtracks")}</h1>
            <p className="soundtracks-hero__lead">{t("Explore the music behind our games.")}</p>
            <p className="soundtracks-hero__detail">{t("Discover game soundtracks collected from YouTube and organized by title.")}</p>
            <div className="soundtracks-hero__stats">
              <span><Disc size={17} /> {t("{0} soundtracks", { 0: total })}</span>
              <span><MusicNotes size={17} /> {t("{0} games", { 0: groups.length })}</span>
            </div>
            {featuredTrack && featuredUrl && (
              <a className="btn btn--primary soundtracks-hero__cta" href={featuredUrl} target="_blank" rel="noopener noreferrer">
                <Play size={18} weight="fill" /> {t("Listen on YouTube")} <ArrowUpRight size={16} />
              </a>
            )}
          </div>
          {featuredTrack && featuredUrl && (
            <a className="soundtracks-featured" href={featuredUrl} target="_blank" rel="noopener noreferrer" aria-label={t("Listen on YouTube") + ": " + featuredTrack.title}>
              <span className="soundtracks-featured__image">
                {featuredImage && <img src={featuredImage} alt="" />}
                <span className="soundtracks-featured__play"><Play size={30} weight="fill" /></span>
                <span className="soundtracks-featured__tag">{t("Featured soundtrack")}</span>
              </span>
              <span className="soundtracks-featured__copy">
                <span>{featuredGroup.title}</span>
                <strong>{featuredTrack.title}</strong>
                <span className="soundtracks-featured__open">{t("Listen on YouTube")} <ArrowUpRight size={16} /></span>
              </span>
            </a>
          )}
        </div>
      </header>

      <section className="soundtracks-browser">
        <div className="container">
          <div className="soundtracks-browser__heading">
            <div>
              <p className="soundtracks-eyebrow"><Disc size={16} /> {t("The collection")}</p>
              <h2>{t("Find your next soundtrack")}</h2>
              <p>{t("Browse music grouped by the game mentioned in the YouTube title or description.")}</p>
            </div>
            <label className="soundtracks-search">
              <MagnifyingGlass size={19} />
              <span className="sr-only">{t("Search soundtracks or games")}</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("Search soundtracks or games")}
              />
            </label>
          </div>

          {content.status === "loading" && <div role="status" aria-label={t("Loading")}><SkeletonVideos /></div>}
          {content.status === "error" && <ErrorState message={content.error} onRetry={content.retry} />}
          {content.status === "success" && groups.length === 0 && (
            <EmptyState
              title={t("No soundtracks found")}
              message={t("There are no matching YouTube soundtracks for the games in our catalog right now.")}
            />
          )}
          {content.status === "success" && groups.length > 0 && filteredGroups.length === 0 && (
            <EmptyState
              title={t("No soundtracks found")}
              message={t("Try another game or soundtrack title.")}
            />
          )}
          {content.status === "success" && filteredGroups.length > 0 && (
            <>
              {search.trim() && <p className="soundtracks-results">{t("{0} soundtracks found", { 0: filteredCount })}</p>}
              <div className="soundtracks-groups">
                {filteredGroups.map((group) => {
                  const cover = safeImageUrl(group.coverImage);
                  return (
                    <section className="soundtracks-game" key={group.gameId}>
                      <header className="soundtracks-game__header">
                        <div className="soundtracks-game__identity">
                          <span className="soundtracks-game__cover">
                            {cover ? <img src={cover} alt="" loading="lazy" /> : <MusicNotes size={25} />}
                          </span>
                          <div>
                            <h3>{group.title}</h3>
                            <p>{t("{0} soundtracks", { 0: group.videos.length })}</p>
                          </div>
                        </div>
                        {group.slug && <Link className="soundtracks-game__link" to={`/games/${encodeURIComponent(group.slug)}`}>{t("View game")} <ArrowUpRight size={16} /></Link>}
                      </header>
                      <div className="soundtracks-track-grid">
                        {group.videos.map((track) => <SoundtrackCard key={track.id} track={track} language={language} t={t} />)}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
