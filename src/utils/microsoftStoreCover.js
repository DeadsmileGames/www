import { api } from "../services/api";
import { safeImageUrl } from "./urls";

const coverCache = new Map();
const coverRequests = new Map();

function imageDimensions(image) {
  return {
    width: Number(image?.width) || 0,
    height: Number(image?.height) || 0,
  };
}

function area(image) {
  const { width, height } = imageDimensions(image);
  return width * height;
}

function isPortrait(image) {
  const { width, height } = imageDimensions(image);
  return height > width;
}

export function microsoftStoreCoverFromDetails(details) {
  const store = details?.microsoftStore;
  const directCover = [
    store?.coverImage,
    store?.cover_image,
    store?.coverUrl,
    store?.cover_url,
    store?.poster,
    store?.posterUrl,
    store?.poster_url,
    store?.boxArt,
    store?.boxArtUrl,
    store?.box_art_url,
  ]
    .map(safeImageUrl)
    .find(Boolean);
  if (directCover) return directCover;

  const images = Array.isArray(store?.images) ? store.images : [];
  const validImages = images
    .filter((image) => image && typeof image.url === "string")
    .map((image) => ({ ...image, safeUrl: safeImageUrl(image.url) }))
    .filter((image) => image.safeUrl);

  const namedCovers = validImages
    .filter((image) => /poster|box.?art|cover|pack.?art|product.?art/i.test(image.purpose || ""))
    .sort((a, b) => {
      const portraitDifference = Number(isPortrait(b)) - Number(isPortrait(a));
      return portraitDifference || area(b) - area(a);
    });
  if (namedCovers.length) return namedCovers[0].safeUrl;

  const portraitArtwork = validImages
    .filter(
      (image) =>
        isPortrait(image) &&
        !/screenshot|screen.?shot|logo|icon|tile|hero|banner|background/i.test(
          image.purpose || "",
        ),
    )
    .sort((a, b) => area(b) - area(a));
  return portraitArtwork[0]?.safeUrl || null;
}

function hasMicrosoftStoreListing(game) {
  if (game?.microsoftStore?.images?.length) return true;
  if (game?.microsoftStoreBadge) return true;
  return (Array.isArray(game?.offers) ? game.offers : []).some((offer) =>
    /microsoft|windows store|xbox store/i.test(
      `${offer?.provider || ""} ${offer?.name || ""}`,
    ),
  );
}

function cacheKey(game) {
  return String(game?.id ?? game?.slug ?? "");
}

async function fetchMicrosoftStoreCover(game) {
  const direct = microsoftStoreCoverFromDetails(game);
  if (direct) return direct;

  const key = cacheKey(game);
  if (!key || !game?.slug || !hasMicrosoftStoreListing(game)) return null;
  if (coverCache.has(key)) return coverCache.get(key);
  if (coverRequests.has(key)) return coverRequests.get(key);

  const request = (async () => {
    try {
      const details = await api.get(`/games/${encodeURIComponent(game.slug)}`);
      if (
        game.id != null &&
        details?.id != null &&
        String(details.id) !== String(game.id)
      ) {
        return null;
      }
      const cover = microsoftStoreCoverFromDetails(details);
      coverCache.set(key, cover);
      return cover;
    } catch {
      return null;
    } finally {
      coverRequests.delete(key);
    }
  })();

  coverRequests.set(key, request);
  return request;
}

export async function loadMicrosoftStoreCovers(games) {
  const candidates = (Array.isArray(games) ? games : []).filter(
    (game) => game?.slug && hasMicrosoftStoreListing(game),
  );
  const covers = new Map();
  let next = 0;
  const workers = Array.from(
    { length: Math.min(4, candidates.length) },
    async () => {
      while (next < candidates.length) {
        const game = candidates[next++];
        const cover = await fetchMicrosoftStoreCover(game);
        if (cover) covers.set(cacheKey(game), cover);
      }
    },
  );
  await Promise.all(workers);
  return covers;
}
