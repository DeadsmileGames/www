const ITCH_OAUTH_STATE_KEY = "deadsmile:itch-oauth-state";

export function rememberItchOAuthState(authorizeUrl) {
  try {
    const url = new URL(authorizeUrl);
    const state = url.searchParams.get("state");
    if (
      url.protocol !== "https:" ||
      url.hostname !== "itch.io" ||
      url.pathname !== "/user/oauth" ||
      !state ||
      !/^[A-Za-z0-9_-]{40,200}$/.test(state)
    ) {
      return false;
    }
    window.sessionStorage.setItem(ITCH_OAUTH_STATE_KEY, state);
    return window.sessionStorage.getItem(ITCH_OAUTH_STATE_KEY) === state;
  } catch {
    return false;
  }
}

export function consumeExpectedItchOAuthState(state) {
  if (typeof state !== "string" || !/^[A-Za-z0-9_-]{40,200}$/.test(state)) {
    return false;
  }
  try {
    const expected = window.sessionStorage.getItem(ITCH_OAUTH_STATE_KEY);
    if (!expected || expected !== state) return false;
    window.sessionStorage.removeItem(ITCH_OAUTH_STATE_KEY);
    return true;
  } catch {
    return false;
  }
}
