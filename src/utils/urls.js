function parseUrl(value, { allowRelative = false } = {}) {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  if (allowRelative && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function safeHttpsUrl(value) {
  const parsed = parseUrl(value);
  return parsed ? parsed.toString() : null;
}

export function safeDownloadUrl(value) {
  return safeHttpsUrl(value);
}

export function safeItchUrl(value) {
  const parsed = parseUrl(value);
  if (!parsed || typeof parsed === 'string') return null;
  const host = parsed.hostname.toLowerCase();
  return host === 'itch.io' || host.endsWith('.itch.io') ? parsed.toString() : null;
}

export function safeImageUrl(value) {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  if (/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(raw)) return raw;
  return safeHttpsUrl(raw);
}

export function safeYoutubeEmbedUrl(value) {
  const parsed = parseUrl(value);
  if (!parsed || typeof parsed === 'string') return null;
  const host = parsed.hostname.toLowerCase();
  let id = '';
  if (host === 'youtu.be') {
    id = parsed.pathname.split('/').filter(Boolean)[0] || '';
  } else if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com' || host === 'www.youtube-nocookie.com') {
    if (parsed.pathname === '/watch') id = parsed.searchParams.get('v') || '';
    else {
      const match = parsed.pathname.match(/^\/(?:embed|shorts)\/([A-Za-z0-9_-]+)$/);
      id = match?.[1] || '';
    }
  }
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

export function safeOAuthItchUrl(value) {
  const parsed = parseUrl(value);
  if (!parsed || typeof parsed === 'string') return null;
  return parsed.hostname.toLowerCase() === 'itch.io' && parsed.pathname === '/user/oauth'
    ? parsed.toString()
    : null;
}
