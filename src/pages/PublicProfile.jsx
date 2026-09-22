import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowUpRight,
    Clock,
    GameController,
    Images,
    ShoppingCart,
    Trophy,
    X,
} from "@phosphor-icons/react";
import { api } from "../services/api";
import { Modal } from "../components/ui/Modal";
import { Lightbox } from "../components/ui/Lightbox";
import { safeHttpsUrl, safeImageUrl, safeItchUrl } from "../utils/urls";

const duration = (ms) => {
    const hours = Math.floor(Number(ms || 0) / 3_600_000);
    const minutes = Math.floor((Number(ms || 0) % 3_600_000) / 60_000);
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export function PublicProfile() {
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(false);
    const [gallery, setGallery] = useState(null);
    const [selected, setSelected] = useState(null);
    useEffect(() => {
        let active = true;
        setProfile(null);
        setError(false);
        setGallery(null);
        setSelected(null);
        api.get(`/account/profile/${encodeURIComponent(username)}`)
            .then((data) => {
                if (!active) return;
                if (!data || typeof data.username !== "string") setError(true);
                else setProfile(data);
            })
            .catch(() => {
                if (active) setError(true);
            });
        return () => {
            active = false;
        };
    }, [username]);
    if (error)
        return (
            <div className="profile-page container">
                <Link to="/" className="back-link">
                    <ArrowLeft weight="bold" />
                    Back
                </Link>
                <h1>Profile not found.</h1>
            </div>
        );
    if (!profile)
        return (
            <div className="profile-page container">
                <p>Loading profile…</p>
            </div>
        );
    const games = profile.recentGames || [];
    const achievements = profile.achievements || [];
    const images = (gallery?.screenshots || [])
        .map(safeImageUrl)
        .filter(Boolean);
    const websiteUrl = safeHttpsUrl(profile.websiteUrl);
    return (
        <div className="profile-page container">
            <Link to="/" className="back-link">
                <ArrowLeft weight="bold" />
                <span>Back</span>
            </Link>
            <header className="profile-page__hero">
                <div className="profile-page__avatar">
                    {safeImageUrl(profile.avatarUrl) ? (
                        <img src={safeImageUrl(profile.avatarUrl)} alt="" />
                    ) : (
                        profile.username.slice(0, 1).toUpperCase()
                    )}
                </div>
                <div>
                    <h1>@{profile.username}</h1>
                    <p>{profile.bio || "No bio yet."}</p>
                    <div className="profile-page__facts">
                        <span>
                            Member since{" "}
                            {new Date(profile.createdAt).toLocaleDateString()}
                        </span>
                        {profile.location && <span>{profile.location}</span>}
                        {websiteUrl && (
                            <a
                                href={websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Website <ArrowUpRight size={14} weight="bold" />
                            </a>
                        )}
                    </div>
                </div>
            </header>
            <section className="profile-section">
                <div className="profile-section__head">
                    <div>
                        <GameController size={23} weight="bold" />
                        <h2>Recently played</h2>
                    </div>
                    <span>{games.length} games</span>
                </div>
                {games.length ? (
                    <div className="profile-games">
                        {games.map((game) => (
                            <article key={game.id}>
                                <img
                                    src={
                                        safeImageUrl(game.coverImage) ||
                                        safeImageUrl(game.heroImage) ||
                                        "/assets/placeholders/game-cover.svg"
                                    }
                                    alt=""
                                    loading="lazy"
                                />
                                <div>
                                    <h3>{game.title}</h3>
                                    <p>
                                        <Clock size={14} weight="bold" />
                                        {duration(game.totalMs)} ·{" "}
                                        {game.sessions} sessions
                                    </p>
                                    <div className="profile-game-actions">
                                        <Link to={`/games/${game.slug}`} className="btn btn--primary">
                                            View game
                                        </Link>
                                        {safeItchUrl(game.purchaseUrl) && (
                                            <a
                                                href={safeItchUrl(
                                                    game.purchaseUrl,
                                                )}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn--primary"
                                            >
                                                <ShoppingCart
                                                    size={14}
                                                    weight="bold"
                                                />
                                                Buy
                                            </a>
                                        )}
                                        {game.screenshots?.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setGallery(game)}
                                            >
                                                <Images
                                                    size={14}
                                                    weight="bold"
                                                />
                                                Screenshots
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="profile-empty">
                        No public play activity yet.
                    </div>
                )}
            </section>
            <section className="profile-section">
                <div className="profile-section__head">
                    <div>
                        <Trophy size={23} weight="bold" />
                        <h2>Achievements</h2>
                    </div>
                    <span>{achievements.length} unlocked</span>
                </div>
                {achievements.length ? (
                    <div className="profile-achievements">
                        {achievements.map((item) => (
                            <article key={`${item.gameSlug}-${item.key}`}>
                                <Trophy size={22} weight="bold" />
                                <div>
                                    <strong>{item.title}</strong>
                                    <span>
                                        {item.gameTitle} · {item.points} points
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="profile-empty">
                        No achievements unlocked yet.
                    </div>
                )}
            </section>
            <Modal
                open={Boolean(gallery)}
                onClose={() => {
                    setSelected(null);
                    setGallery(null);
                }}
                labelledBy="profile-gallery-title"
            >
                <div className="profile-gallery">
                    <button
                        type="button"
                        onClick={() => {
                            setSelected(null);
                            setGallery(null);
                        }}
                        aria-label="Close"
                    >
                        <X size={19} weight="bold" />
                    </button>
                    <h2 id="profile-gallery-title">
                        {gallery?.title} screenshots
                    </h2>
                    <div>
                        {images.map((src, index) => (
                            <button
                                type="button"
                                key={src}
                                onClick={() => setSelected(index)}
                            >
                                <img
                                    src={src}
                                    alt={`Screenshot ${index + 1}`}
                                    loading="lazy"
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
                    setSelected((selected - 1 + images.length) % images.length)
                }
                onNext={() => setSelected((selected + 1) % images.length)}
            />
        </div>
    );
}
