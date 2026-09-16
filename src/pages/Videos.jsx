import { Link, useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../hooks/useContent";
import { useAuth } from "../hooks/useAuth";
import { Reveal } from "../components/ui/Reveal";
import { ArrowLeft, ArrowUpRight, Play, Trash } from "@phosphor-icons/react";
import { api } from "../services/api";
import { safeHttpsUrl, safeImageUrl, safeYoutubeEmbedUrl } from "../utils/urls";
import "./MediaPages.css";

export function Videos() {
    const { t } = useLanguage();
    const { id } = useParams();
    const { user, refresh } = useAuth();
    const navigate = useNavigate();
    const data = useContent("/videos", { limit: 24 });
    const detail = useContent(id ? `/videos/${encodeURIComponent(id)}` : null, {});
    const isAdmin = user?.role === "admin";

    async function remove(videoId, fromDetail = false) {
        if (!window.confirm("Delete this video permanently?")) return;
        try {
            try {
                await api.delete(`/admin/video/${encodeURIComponent(videoId)}`);
            } catch (err) {
                if (err?.status === 401) {
                    await refresh();
                    await api.delete(`/admin/video/${encodeURIComponent(videoId)}`);
                } else throw err;
            }
            fromDetail ? navigate("/videos", { replace: true }) : data.retry();
        } catch (err) {
            window.alert(err.message || "Unable to delete video.");
        }
    }

    if (id) {
        if (detail.status === "idle" || detail.status === "loading" || !detail.data)
            return (
                <div className="media-detail container">
                    <p>Loading…</p>
                </div>
            );
        if (detail.status === "error")
            return (
                <div className="media-detail container">
                    <Link to="/videos" className="back-link">
                        <ArrowLeft weight="bold" /> <span>Back</span>
                    </Link>
                    <h1>Video not found.</h1>
                </div>
            );
        const v = detail.data;
        const embedUrl = safeYoutubeEmbedUrl(v.video_url);
        const externalVideoUrl = safeHttpsUrl(v.video_url);
        return (
            <div className="media-detail container">
                <Link to="/videos" className="back-link">
                    <ArrowLeft weight="bold" /> <span>Back</span>
                </Link>
                <Reveal>
                    <header className="media-detail__header">
                        <div className="media-detail__eyebrow">
                            <span>
                                {v.duration_seconds
                                    ? `${Math.floor(v.duration_seconds / 60)}:${String(v.duration_seconds % 60).padStart(2, "0")}`
                                    : "WATCH"}
                            </span>
                        </div>
                        <h1>{v.title}</h1>
                    </header>
                    <div className="media-detail__player">
                        {embedUrl ? (
                            <iframe
                                src={embedUrl}
                                title={v.title}
                                allow="autoplay; encrypted-media; picture-in-picture"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            />
                        ) : externalVideoUrl ? (
                            <div className="media-detail__empty">
                                <Play weight="bold" size={28} />
                                <a href={externalVideoUrl} target="_blank" rel="noopener noreferrer">Open video</a>
                            </div>
                        ) : (
                            <div className="media-detail__empty">
                                <Play weight="bold" size={28} />
                                <span>No video source available.</span>
                            </div>
                        )}
                    </div>
                    {isAdmin && (
                        <button
                            className="media-detail__delete"
                            type="button"
                            onClick={() => remove(v.id, true)}
                        >
                            <Trash weight="bold" /> Delete video
                        </button>
                    )}
                </Reveal>
            </div>
        );
    }

    const videosList = data.status === "success" ? data.data : [];
    const featuredVideo = videosList.length > 0 ? videosList[0] : null;
    const remainingVideos = videosList.length > 0 ? videosList.slice(1) : [];

    return (
        <div className="media-page container">
            <Link to="/" className="back-link">
                <ArrowLeft weight="bold" /> <span>Back</span>
            </Link>
            <Reveal>
                <div className="media-page__heading">
                    <div>
                        <h1>{t("nav.videos")}</h1>
                    </div>
                    <p className="media-page__intro">{t("media.videoIntro")}</p>
                </div>
            </Reveal>

            {data.status === "loading" && <p>Loading…</p>}
            {data.status === "error" && <p>{data.error}</p>}

            {data.status === "success" && featuredVideo && (
                <Reveal>
                    <div className="media-featured-wrapper">
                        <div className="media-featured">
                            <Link to={`/videos/${featuredVideo.id}`} className="media-featured__visual">
                                {featuredVideo.thumbnail && (
                                    <img src={safeImageUrl(featuredVideo.thumbnail)} alt="" loading="lazy" />
                                )}
                                <span>
                                    <Play weight="bold" size={26} />
                                </span>
                            </Link>
                            <div className="media-featured__meta">
                                <div>
                                    <small>{featuredVideo.category || "Destaque"}</small>
                                    <h2>{featuredVideo.title}</h2>
                                </div>
                                <div className="media-tile__actions" style={{ marginTop: "20px" }}>
                                    <Link to={`/videos/${featuredVideo.id}`}>
                                        {t("media.play")} <ArrowUpRight weight="bold" />
                                    </Link>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            className="media-featured__delete"
                                            onClick={() => remove(featuredVideo.id)}
                                            aria-label={`Delete ${featuredVideo.title}`}
                                        >
                                            <Trash weight="bold" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>
            )}

            <div className="media-page__grid">
                {remainingVideos.map((v, i) => (
                    <Reveal key={v.id} delay={i * 60}>
                        <article className="media-tile">
                            <Link to={`/videos/${v.id}`} className="media-tile__visual">
                                {v.thumbnail && (
                                    <img src={safeImageUrl(v.thumbnail)} alt="" loading="lazy" />
                                )}
                                <span>
                                    <Play weight="bold" size={20} />
                                </span>
                            </Link>
                            <div className="media-tile__meta">
                                <div>
                                    <small>{v.category}</small>
                                    <h2>{v.title}</h2>
                                </div>
                                <div className="media-tile__actions">
                                    <Link to={`/videos/${v.id}`}>
                                        {t("media.play")}{" "}
                                        <ArrowUpRight weight="bold" />
                                    </Link>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => remove(v.id)}
                                            aria-label={`Delete ${v.title}`}
                                        >
                                            <Trash weight="bold" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>
                    </Reveal>
                ))}
            </div>
        </div>
    );
}