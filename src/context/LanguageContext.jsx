import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { translate } from "../i18n/translate";
const strings = {
  nav: {
    home: "Home",
    launcher: "Launcher",
    games: "Games",
    about: "About",
    news: "Newswire",
    videos: "Videos",
    soundtracks: "Soundtracks",
    downloads: "Downloads",
    support: "Support",
    search: "Search",
    account: "Account",
    signIn: "Sign in",
  },
  hero: {
    eyebrow: "Independent game studio",
    title: "Create Worlds. Explore beyond.",
    body: "We build strange places, sharp stories and games that stay with you.",
    explore: "Explore games",
    studio: "Meet the studio",
  },
  common: {
    back: "Back",
    viewAll: "View all",
    learnMore: "Learn more",
    readMore: "Read story",
    retry: "Retry",
    loading: "Loading…",
    close: "Close",
    save: "Save changes",
    cancel: "Cancel",
  },
  games: {
    title: "Games",
    intro: "Our worlds, from first idea to final frame.",
    about: "About",
    related: "More from Deadsmile Games",
    catalog: "Game library",
    previous: "Previous",
    next: "Next",
    page: "Page",
  },
  account: {
    title: "Account",
    profile: "Profile",
    settings: "Settings",
    username: "Username",
    email: "Email",
    member: "Member since",
    lastLogin: "Last login",
    language: "Language",
    deleteTitle: "Delete account",
    deleteCopy: "Deleting your account is permanent. Enter your password to confirm.",
    deleteAction: "Delete account",
    deleteConfirm:
      "Your account and profile will be permanently removed. This cannot be undone.",
    password: "Current password",
    logout: "Log out",
  },
  studio: {
    eyebrow: "Deadsmile Games",
    title: "Create Worlds. Explore beyond.",
    body: "Deadsmile Games is an independent studio built around atmosphere, experimentation and worlds worth getting lost in.",
    vision: "Our approach",
    visionCopy:
      "We start with a feeling, then build the systems, characters and places that make it real. No genre is a boundary.",
    craft: "Built with intent",
    craftCopy:
      "Every frame, sound and interaction exists to move the player somewhere new.",
  },
  news: {
    title: "Newswire",
    intro: "Announcements, development notes and stories from the studio.",
    empty: "No stories yet.",
  },
  support: {
    title: "Support",
    intro: "Need a hand? Find answers, send us a message or check service status.",
    faq: "Frequently asked",
    contact: "Contact support",
    status: "Service status",
    response: "We aim to answer every request as quickly as possible.",
  },
  downloads: {
    title: "Downloads",
    intro: "Launchers, patches and official Deadsmile Games files.",
    launcher: "Deadsmile Games Launcher",
    launcherCopy: "Keep your games updated and ready to play.",
    download: "Download",
    unavailable: "Coming soon",
  },
  media: {
    videoIntro: "Stories, trailers and glimpses from inside our worlds.",
    play: "Play film",
    store: "Store",
    storeIntro: "Objects from the worlds we build. The first collection is coming soon.",
    coming: "Coming soon",
    items: ["Studio tee", "Worlds collection", "Limited art print"],
  },
  footer: {
    line: "Independent games. Built without compromise.",
    legal: "Privacy",
    terms: "Terms",
    contact: "Contact",
  },
  auth: {
    login: "Sign in",
    register: "Create an account",
    email: "Email",
    password: "Password",
    username: "Username",
    confirm: "Confirm password",
    newTo: "New to Deadsmile Games?",
    existing: "Already have an account?",
    create: "Create an account",
    signing: "Signing in…",
    creating: "Creating account…",
  },
};
const LanguageContext = createContext(null);
export function LanguageProvider({ children }) {
  const [language, updateLanguage] = useState(() => {
    try {
      const value = localStorage.getItem("deadsmile.language");
      return ["en", "es", "pt-BR"].includes(value) ? value : "en";
    } catch {
      return "en";
    }
  });
  const setLanguage = (value) => {
    if (!["en", "es", "pt-BR"].includes(value)) return;
    try {
      localStorage.setItem("deadsmile.language", value);
    } catch {}
    updateLanguage(value);
  };
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";

    const description = translate(
      "Deadsmile Games — independent games, worlds and stories built without compromise.",
      language,
    );
    const socialDescription = translate("Independent games. Built without compromise.", language);
    const metadata = [
      ['meta[name="description"]', description],
      ['meta[property="og:description"]', socialDescription],
      ['meta[name="twitter:description"]', socialDescription],
      ['meta[property="og:image:alt"]', description],
      ['meta[name="twitter:image:alt"]', description],
    ];

    for (const [selector, content] of metadata) {
      document.querySelector(selector)?.setAttribute("content", content);
    }

    document
      .querySelector('meta[property="og:locale"]')
      ?.setAttribute(
        "content",
        language === "pt-BR" ? "pt_BR" : language === "es" ? "es_ES" : "en_US",
      );
  }, [language]);
  const t = useCallback(
    (path, variables) =>
      translate(
        typeof path === "string"
          ? (path.split(".").reduce((v, k) => v?.[k], strings) ?? path)
          : path,
        language,
        variables,
      ),
    [language],
  );
  return (
    <LanguageContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useLanguage() {
  return useContext(LanguageContext);
}
