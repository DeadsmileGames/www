import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  HeartStraight,
  Play,
  GameController,
} from "@phosphor-icons/react";
import { api, friendlyErrorMessage } from "../services/api";
import { ProductHero, productIcon } from "../components/games/ProductHero";
import { StoreOffers } from "../components/games/StoreOffers";
import { StoreInformation, StoreRatings } from "../components/games/StoreInformation";
import { GameMeta } from "../components/games/GameMeta";
import { GameGrid } from "../components/games/GameGrid";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonDetail } from "../components/ui/Skeleton";
import { Lightbox } from "../components/ui/Lightbox";
import { Modal } from "../components/ui/Modal";
import { useWishlist } from "../hooks/useWishlist";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { safeHttpsUrl, safeImageUrl, safeItchUrl, safeOAuthItchUrl } from "../utils/urls";

const LAUNCHER_DOWNLOAD_URL = "/launcher";

export function GameDetails() {
  const { slug } = useParams();
  const { t, language } = useLanguage();
  const { user, status: authStatus } = useAuth();
  const navigate = useNavigate();
  const launcherCleanup = useRef(() => {});
  const libraryRequest = useRef(0);

  const [state, setState] = useState({
    status: "loading",
    game: null,
    error: null,
  });
  const [revision, setRevision] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [failedScreenshots, setFailedScreenshots] = useState([]);
  const [library, setLibrary] = useState({
    gameId: null,
    userId: null,
    status: "idle",
    inLibrary: false,
    error: "",
  });
  const [libraryRevision, setLibraryRevision] = useState(0);
  const [purchase, setPurchase] = useState({
    open: false,
    status: "idle",
    message: "",
  });
  const [launcherMissing, setLauncherMissing] = useState(false);
  const [download, setDownload] = useState({ busy: false, error: "" });

  const game = state.game;
  const gameId = game?.id || null;
  const isValidGameId = typeof gameId === "string" && gameId.length > 0;
  const libraryMatches = library.gameId === gameId && library.userId === user?.id;
  const libraryReady =
    authStatus === "authenticated" && libraryMatches && library.status === "success";
  const owned = libraryReady && library.inLibrary;
  const showWishlist = libraryReady && isValidGameId && !library.inLibrary;

  const {
    inWishlist,
    loading: wishlistLoading,
    error: wishlistError,
    toggle,
  } = useWishlist(isValidGameId ? gameId : null);

  useEffect(() => () => launcherCleanup.current(), []);

  useEffect(() => {
    let cancelled = false;

    launcherCleanup.current();
    setState({ status: "loading", game: null, error: null });
    setSelectedImageIndex(null);
    setFailedScreenshots([]);
    setLauncherMissing(false);

    api
      .get(`/games/${encodeURIComponent(slug)}`)
      .then((result) => {
        if (!cancelled) {
          setState({ status: "success", game: result, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: error.status === 404 ? "not-found" : "error",
            game: null,
            error: friendlyErrorMessage(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, revision, language]);

  useEffect(() => {
    const request = ++libraryRequest.current;

    if (authStatus !== "authenticated" || !gameId || !user?.id) {
      setLibrary({
        gameId: null,
        userId: null,
        status: "idle",
        inLibrary: false,
        error: "",
      });
      return undefined;
    }

    let active = true;
    const userId = user.id;

    setLibrary({
      gameId,
      userId,
      status: "loading",
      inLibrary: false,
      error: "",
    });

    api
      .get("/library")
      .then((data) => {
        if (!Array.isArray(data?.items)) {
          throw { code: "INVALID_RESPONSE" };
        }

        if (active && request === libraryRequest.current) {
          setLibrary({
            gameId,
            userId,
            status: "success",
            inLibrary: data.items.some((item) => item.id === gameId),
            error: "",
          });
        }
      })
      .catch((error) => {
        if (active && request === libraryRequest.current) {
          setLibrary({
            gameId,
            userId,
            status: "error",
            inLibrary: false,
            error: friendlyErrorMessage(error),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [authStatus, user?.id, gameId, libraryRevision, revision]);

  useEffect(() => {
    const update = (event) => {
      const detail = event.detail;

      if (!/^(game|video)\.(published|updated|deleted)$/.test(detail?.event_type || "")) {
        return;
      }

      if (
        detail.event_type === "game.deleted" &&
        (detail.payload?.id || detail.entity_id) === gameId
      ) {
        navigate("/games", { replace: true });
        return;
      }

      if (
        detail.payload?.id === gameId &&
        detail.payload?.slug &&
        detail.payload.slug !== slug
      ) {
        navigate(`/games/${encodeURIComponent(detail.payload.slug)}`, {
          replace: true,
        });
      } else {
        setRevision((value) => value + 1);
      }
    };

    window.addEventListener("deadsmile:live", update);
    return () => window.removeEventListener("deadsmile:live", update);
  }, [gameId, slug, navigate]);

  async function verifyPurchase(openCheckout = true, launch = false) {
    if (authStatus !== "authenticated") {
      navigate("/login", {
        state: { from: { pathname: `/games/${slug}` } },
      });
      return;
    }

    try {
      setPurchase({ open: true, status: "checking", message: "" });
      const result = await api.post(`/library/${gameId}/verify`);

      if (result.owned) {
        libraryRequest.current++;
        setLibrary({
          gameId,
          userId: user.id,
          status: "success",
          inLibrary: true,
          error: "",
        });
        setPurchase({ open: !launch, status: "owned", message: "" });

        if (launch) openInLauncher();
        return;
      }

      setPurchase({ open: true, status: "checkout", message: "" });

      const checkoutUrl = safeItchUrl(result.purchaseUrl);
      if (openCheckout && checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setPurchase({
        open: true,
        status: error?.code === "ITCH_NOT_CONNECTED" ? "connect" : "error",
        message: friendlyErrorMessage(error),
      });
    }
  }

  async function downloadGame() {
    if (download.busy) return;

    setDownload({ busy: true, error: "" });

    try {
      const result = await api.get(`/games/${encodeURIComponent(slug)}/download`);
      const url = safeHttpsUrl(result.downloadUrl);
      if (!url) throw { code: "INVALID_RESPONSE" };

      if (authStatus === "authenticated" && user?.id) {
        libraryRequest.current++;
        setLibrary({
          gameId,
          userId: user.id,
          status: "success",
          inLibrary: true,
          error: "",
        });
      }

      window.location.assign(url);
      setDownload({ busy: false, error: "" });
    } catch (error) {
      setDownload({ busy: false, error: friendlyErrorMessage(error) });
    }
  }

  async function connectItch() {
    try {
      const result = await api.post("/integrations/itch/connect", {
        client: "site",
        locale: language,
        returnPath: `/games/${slug}`,
      });

      const authorizeUrl = safeOAuthItchUrl(result.authorizeUrl);
      if (!authorizeUrl) throw { code: "INVALID_RESPONSE" };

      window.location.assign(authorizeUrl);
    } catch (error) {
      setPurchase({
        open: true,
        status: "error",
        message: friendlyErrorMessage(error),
      });
    }
  }

  function openInLauncher() {
    launcherCleanup.current();
    setLauncherMissing(false);

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        String(gameId || ""),
      )
    ) {
      return;
    }

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("blur", cleanup);
      document.removeEventListener("visibilitychange", hidden);
    };

    const hidden = () => {
      if (document.visibilityState === "hidden") cleanup();
    };

    const timer = setTimeout(() => {
      cleanup();
      setLauncherMissing(true);
    }, 2000);

    launcherCleanup.current = cleanup;
    window.addEventListener("blur", cleanup);
    document.addEventListener("visibilitychange", hidden);
    window.location.href = `deadsmile://launch?gameId=${encodeURIComponent(gameId)}`;
  }

  useEffect(() => {
    if (!purchase.open || purchase.status !== "checkout") return undefined;

    const onFocus = () => verifyPurchase(false);
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, [purchase.open, purchase.status, gameId]);

  const store = game?.microsoftStore;
  const hasMicrosoftStore = Boolean(store || game?.microsoftStoreBadge?.productId);
  const screenshotFolder = game?.slug || slug || "";

  const screenshotItems = hasMicrosoftStore
    ? (Array.isArray(store?.screenshots) ? store.screenshots : []).map((item) => ({
        url: safeImageUrl(typeof item === "string" ? item : item?.url),
        caption: typeof item === "string" ? "" : item?.caption || "",
      }))
    : /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(screenshotFolder)
      ? Array.from({ length: 6 }, (_, index) => ({
          url: `/assets/games/screenshots/${encodeURIComponent(screenshotFolder)}/${index + 1}.png`,
          caption: "",
        }))
      : [];

  const seenScreenshots = new Set();
  const visibleScreenshots = screenshotItems.filter((item) => {
    if (
      !item.url ||
      failedScreenshots.includes(item.url) ||
      seenScreenshots.has(item.url)
    ) {
      return false;
    }

    seenScreenshots.add(item.url);
    return true;
  });

  const screenshots = visibleScreenshots.map((item) => item.url);
  const icon = safeImageUrl(productIcon(store));
  const selectedIndex =
    selectedImageIndex === null || !screenshots.length
      ? null
      : Math.min(selectedImageIndex, screenshots.length - 1);

  const gameVideos = game?.videos || [];
  const trailerVideos = gameVideos.filter(
    (video) => String(video.category || "").toLowerCase() === "trailer",
  );

  function removeFailedScreenshot(url) {
    setFailedScreenshots((current) =>
      current.includes(url) ? current : [...current, url],
    );
    setSelectedImageIndex(null);
  }

  function goPrev() {
    if (selectedIndex === null) return;
    setSelectedImageIndex((selectedIndex - 1 + screenshots.length) % screenshots.length);
  }

  function goNext() {
    if (selectedIndex === null) return;
    setSelectedImageIndex((selectedIndex + 1) % screenshots.length);
  }

  if (state.status === "loading") return <SkeletonDetail />;

  if (state.status === "not-found") {
    return (
      <div className="container game-details__notfound">
        <ErrorState title={t("GAME NOT FOUND")} message={state.error} />
        <Link to="/games" className="btn btn--primary">
          <ArrowLeft weight="bold" />
          <span>{t("Browse games")}</span>
        </Link>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="container game-details__notfound">
        <Link to="/games" className="back-link">
          <ArrowLeft weight="bold" />
          <span>{t("Back")}</span>
        </Link>
        <ErrorState
          message={state.error}
          onRetry={() => setRevision((value) => value + 1)}
        />
      </div>
    );
  }

  return (
    <div className="game-details game-product-page">
      <ProductHero title={game.title} icon={icon} images={screenshots}>
        {game.launcherAvailable && (
          <button
            type="button"
            className="btn btn--primary game-details__btn"
            disabled={purchase.status === "checking"}
            onClick={() => (game.isFree ? openInLauncher() : verifyPurchase(false, true))}
          >
            <GameController weight="bold" />
            {t("Play in Launcher")}
          </button>
        )}

        {showWishlist && (
          <button
            type="button"
            className="btn btn--secondary game-details__btn"
            aria-pressed={inWishlist}
            disabled={wishlistLoading}
            onClick={toggle}
          >
            {inWishlist ? (
              <>
                <HeartStraight weight="bold" />
                <span>{t("Wishlisted")}</span>
              </>
            ) : (
              <>
                <Heart weight="bold" />
                <span>{t("Wishlist")}</span>
              </>
            )}
          </button>
        )}
      </ProductHero>

      <div className="container game-details__body">
        <div className="game-details__main">
          {authStatus === "authenticated" &&
            libraryMatches &&
            library.status === "error" && (
              <ErrorState
                message={library.error}
                onRetry={() => setLibraryRevision((value) => value + 1)}
              />
            )}

          {showWishlist && wishlistError && (
            <p className="account-page__error" role="alert">
              {t(wishlistError)}
            </p>
          )}

          {launcherMissing && (
            <p className="game-details__launcher-hint">
              {t("Launcher not found.")}{" "}
              <a href={LAUNCHER_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                {t("Download it here")}
              </a>{" "}
              {t("and try again.")}
            </p>
          )}

          <section className="launcher-page__about" style={{ marginTop: 0 }}>
            <h2 className="launcher-page__section-title">{t("games.about")}</h2>
            <p className="game-details__description">
              {game.description || game.shortDescription}
            </p>

            {store && (
              <div className="launcher-page__about">
                <StoreInformation store={store} />
              </div>
            )}
          </section>

          {visibleScreenshots.length > 0 && (
            <section className="game-details__screenshots" style={{ marginTop: 45 }}>
              <h2 className="game-details__screenshots-title launcher-page__section-title">
                {t("Screenshots")}
              </h2>

              <div className="game-details__screenshots-grid">
                {visibleScreenshots.map((item, index) => (
                  <button
                    type="button"
                    key={item.url}
                    className="game-details__screenshot-item"
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={t("Open screenshot {0}", { 0: index + 1 })}
                  >
                    <img
                      src={item.url}
                      alt={item.caption || t("Screenshot {0}", { 0: index + 1 })}
                      loading="lazy"
                      onError={() => removeFailedScreenshot(item.url)}
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          {gameVideos.length > 0 && (
            <section className="game-details__videos">
              <h2 className="launcher-page__section-title">{t("Videos")}</h2>

              <div>
                {gameVideos.map((video) => (
                  <Link
                    to={`/videos?video=${encodeURIComponent(video.id)}`}
                    key={video.id}
                    className="game-video-card"
                  >
                    <span className="game-video-card__visual">
                      {safeImageUrl(video.thumbnail) && (
                        <img src={safeImageUrl(video.thumbnail)} alt="" loading="lazy" />
                      )}
                      <i>
                        <Play size={20} weight="bold" />
                      </i>
                    </span>
                    <span>
                      <strong>{video.title}</strong>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="game-details__aside">
          <StoreRatings store={store} />

          {game.offers?.length > 0 && (
            <section
              className="game-meta game-details__availability"
              aria-labelledby="game-availability-title"
            >
              <h3 id="game-availability-title">{t("Available on")}</h3>

              <StoreOffers
                game={game}
                onDownload={downloadGame}
                downloadBusy={download.busy}
              />

              {game.commerceEnabled && game.purchaseUrl && game.itchGameId && !owned && (
                <div className="game-details__availability-actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    disabled={purchase.status === "checking"}
                    onClick={() => verifyPurchase(false)}
                  >
                    <ShoppingCart weight="bold" />
                    {t("Verify purchase")}
                  </button>
                </div>
              )}

              {download.error && (
                <p className="account-page__error" role="alert">
                  {download.error}
                </p>
              )}
            </section>
          )}

          <GameMeta game={game} />

          <div className="game-details__trailer-list">
            {trailerVideos.map((video, index) => (
              <Link
                to={`/videos?video=${encodeURIComponent(video.id)}`}
                className="btn btn--secondary game-details__trailer"
                key={video.id}
              >
                <Play weight="bold" />
                {trailerVideos.length > 1
                  ? t("Watch trailer {0}", { 0: index + 1 })
                  : t("Watch trailer")}
              </Link>
            ))}

            {!trailerVideos.length && safeHttpsUrl(game.trailerUrl) && (
              <a
                href={safeHttpsUrl(game.trailerUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--secondary game-details__trailer"
              >
                <Play weight="bold" />
                {t("Watch trailer")}
              </a>
            )}
          </div>
        </aside>
      </div>

      {game.relatedGames?.length > 0 && (
        <section className="container game-details__related">
          <h2>{t("games.related")}</h2>
          <GameGrid games={game.relatedGames} />
        </section>
      )}

      {game.recommendedGame && (
        <section className="container game-details__related game-details__recommended">
          <h2>{t("Recommended from Deadsmile Games")}</h2>
          <GameGrid games={[game.recommendedGame]} />
        </section>
      )}

      <Lightbox
        images={screenshots}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedImageIndex(null)}
        onPrev={goPrev}
        onNext={goNext}
      />

      <Modal
        open={purchase.open}
        onClose={() => setPurchase((current) => ({ ...current, open: false }))}
        labelledBy="purchase-dialog-title"
      >
        <div className="purchase-dialog">
          <h2 id="purchase-dialog-title">
            {purchase.status === "connect" && t("Connect your itch.io account")}
            {purchase.status === "checking" && t("Checking your library")}
            {purchase.status === "checkout" && t("Complete your purchase")}
            {purchase.status === "owned" && t("Game verified")}
            {purchase.status === "error" && t("Verification unavailable")}
          </h2>

          <p>
            {purchase.status === "connect" &&
              t(
                "Deadsmile Games uses your itch.io account only to verify games you purchased or claimed.",
              )}
            {purchase.status === "checking" &&
              t("We are securely checking this game against your itch.io library.")}
            {purchase.status === "checkout" &&
              t(
                "Complete the checkout on itch.io, then return to this tab. Your library will update automatically.",
              )}
            {purchase.status === "owned" &&
              t(
                "This game is now available in your Deadsmile Games library and launcher.",
              )}
            {purchase.status === "error" && purchase.message}
          </p>

          <div className="purchase-dialog__actions">
            {purchase.status === "connect" && (
              <button type="button" className="btn btn--primary" onClick={connectItch}>
                {t("Connect itch.io")}
              </button>
            )}

            {purchase.status === "checkout" && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => verifyPurchase(false)}
              >
                {t("Verify purchase")}
              </button>
            )}

            {purchase.status === "checkout" && safeItchUrl(game.purchaseUrl) && (
              <a
                className="btn btn--secondary"
                href={safeItchUrl(game.purchaseUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("Open checkout")}
              </a>
            )}

            {purchase.status === "error" && (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => verifyPurchase(false)}
              >
                {t("Try again")}
              </button>
            )}

            {purchase.status === "owned" && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => verifyPurchase(false, true)}
              >
                <GameController weight="bold" />
                {t("Play in Launcher")}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
