import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CaretDown,
  DownloadSimple,
  Envelope,
  GameController,
  Headset,
  LinkSimple,
  LockKey,
  MagnifyingGlass,
  ShieldCheck,
  ShoppingCart,
  UserCircle,
  UserGear,
  Wrench,
} from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { useGames } from "../hooks/useGames";
import { useContent } from "../hooks/useContent";
import { api, friendlyErrorMessage } from "../services/api";
import { useToast } from "../components/ui/Toast";
import { safeImageUrl } from "../utils/urls";

const faqItems = [
  [
    "How are game updates installed?",
    "The launcher checks supported games before play and offers an update without replacing the active installation until the new build is ready.",
    "technical",
  ],
  [
    "My itch.io game is not showing. What should I do?",
    "Refresh your linked library from account settings. A game not found is shown separately from a temporary connection problem.",
    "account",
  ],
  [
    "How do cloud saves work?",
    "Supported games synchronize their save before and after play. If both copies changed, the newer cloud copy is kept until you choose what to replace.",
    "technical",
  ],
  [
    "Where are purchases handled?",
    "Purchases are completed and owned on itch.io. Deadsmile Games stores only the verified entitlement needed for your library.",
    "purchase",
  ],
];

const solutions = [
  { title: "support.solution.preorder", description: "support.solution.preorderDescription", category: "purchase", Icon: ShoppingCart },
  { title: "support.solution.password", description: "support.solution.passwordDescription", category: "account", Icon: LockKey },
  { title: "support.solution.security", description: "support.solution.securityDescription", category: "account", Icon: ShieldCheck },
  { title: "support.solution.account", description: "support.solution.accountDescription", category: "account", Icon: UserGear },
  { title: "support.solution.linking", description: "support.solution.linkingDescription", category: "account", Icon: LinkSimple },
  { title: "support.solution.technical", description: "support.solution.technicalDescription", category: "technical", Icon: Wrench },
];

const services = [
  { title: "Launcher", description: "support.service.launcher", href: "/launcher", Icon: DownloadSimple },
  { title: "Account", description: "support.service.account", href: "/account", Icon: UserCircle },
  { title: "Library", description: "support.service.library", href: "/library", Icon: GameController },
  { title: "Knowledge base", description: "support.service.articles", href: "/newswire", Icon: BookOpen },
];

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function gameCover(game) {
  return safeImageUrl(
    game?.coverImage ||
      game?.cover_image ||
      game?.heroImage ||
      game?.hero_image ||
      game?.image ||
      game?.thumbnail,
  );
}

function gameKey(game) {
  return String(game?.id ?? game?.slug ?? "");
}

export function Support() {
  const { t, language } = useLanguage();
  const { push } = useToast();
  const requestRef = useRef(null);
  const { status: gamesStatus, games, error: gamesError, retry: retryGames } = useGames({ limit: 48 });
  const news = useContent("/newswire", { limit: 6 });
  const [openFaq, setOpenFaq] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedGameId, setSelectedGameId] = useState("");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ email: "", category: "technical", message: "" });

  const selectedGame = games.find((game) => gameKey(game) === selectedGameId) || null;
  const gameTiles = games.slice(0, 12);
  const articles = Array.isArray(news.data) ? news.data.slice(0, 6) : [];
  const heroArt = games.filter((game) => gameCover(game)).slice(0, 10);

  const searchResults = useMemo(() => {
    const term = normalizeSearch(search.trim());
    if (!term) return [];
    const results = [];

    for (const [question, answer, category] of faqItems) {
      if (normalizeSearch(question + " " + answer).includes(term)) {
        results.push({ type: "faq", title: t(question), description: t(answer), category });
      }
    }
    for (const game of games) {
      if (normalizeSearch([game.title, game.slug, game.description].filter(Boolean).join(" ")).includes(term)) {
        results.push({ type: "game", title: game.title, description: t("Select this game for support"), game });
      }
    }
    for (const article of articles) {
      if (normalizeSearch([article.title, article.excerpt, article.category].filter(Boolean).join(" ")).includes(term)) {
        results.push({
          type: "article",
          title: article.title,
          description: article.excerpt || t("support.articleDescription"),
          href: article.slug ? `/newswire/${encodeURIComponent(article.slug)}` : "/newswire",
        });
      }
    }
    return results.slice(0, 8);
  }, [search, games, articles, t]);

  const filteredArticles = search.trim()
    ? articles.filter((article) =>
        normalizeSearch([article.title, article.excerpt].filter(Boolean).join(" ")).includes(normalizeSearch(search)),
      )
    : articles;

  function change(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  }

  function chooseGame(game) {
    setSelectedGameId(gameKey(game));
    requestAnimationFrame(() => requestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function startRequest(category) {
    setForm((current) => ({ ...current, category }));
    requestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(event) {
    event.preventDefault();
    if (!selectedGame) {
      push(t("Please select a game before sending your request."), "error");
      return;
    }
    setSending(true);
    try {
      const gameContext = `[Game: ${selectedGame.title} | Slug: ${selectedGame.slug || "n/a"}]`;
      const message = `${gameContext}\n\n${form.message}`;
      await api.post("/support", { ...form, message });
      setForm((current) => ({ ...current, message: "" }));
      push(t("Your message was sent. We will reply by email."), "success");
    } catch (error) {
      push(friendlyErrorMessage(error), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="support-center">
      <div className="support-center__notice">
        <span>{t("support.notice")}</span>
        <Link to="/newswire">{t("support.noticeLink")} <ArrowUpRight size={13} weight="bold" /></Link>
      </div>

      <header className="support-center__hero">
        <div className="support-center__hero-art" aria-hidden="true">
          {heroArt.map((game, index) => {
            const cover = gameCover(game);
            return cover ? (
              <span className={`support-center__hero-tile support-center__hero-tile--${index % 5}`} key={gameKey(game)}>
                <img src={cover} alt="" loading="lazy" />
              </span>
            ) : null;
          })}
        </div>
        <div className="support-center__hero-shade" aria-hidden="true" />
        <div className="support-center__width support-center__hero-content">
          <span className="support-center__eyebrow">{t("support.eyebrow")}</span>
          <h1>{t("support.title")}</h1>
          <p>{t("support.intro")}</p>
          <button className="btn btn--primary" type="button" onClick={() => requestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            <Headset size={19} weight="bold" />
            {t("support.openRequest")}
            <ArrowRight size={17} weight="bold" />
          </button>
        </div>
      </header>

      <div className="support-center__width">
        <section className="support-center__section" aria-labelledby="support-solutions-title">
          <div className="support-center__section-head">
            <h2 id="support-solutions-title">{t("support.commonSolutions")}</h2>
            <button className="support-center__text-link" type="button" onClick={() => requestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              {t("support.viewAll")} <ArrowRight size={15} weight="bold" />
            </button>
          </div>
          <div className="support-center__solutions">
            {solutions.map(({ title, description, category, Icon }) => (
              <button className="support-center__solution" type="button" key={title} onClick={() => startRequest(category)}>
                <span className="support-center__solution-icon"><Icon size={25} weight="bold" /></span>
                <span className="support-center__solution-copy">
                  <strong>{t(title)}</strong>
                  <small>{t(description)}</small>
                </span>
                <ArrowUpRight className="support-center__solution-arrow" size={16} weight="bold" />
              </button>
            ))}
          </div>
        </section>

        <section className="support-center__section" aria-labelledby="support-games-title">
          <div className="support-center__section-head">
            <div>
              <h2 id="support-games-title">{t("support.games")}</h2>
              <p>{t("support.gamesDescription")}</p>
            </div>
            <Link className="support-center__text-link" to="/games">
              {t("support.viewAll")} <ArrowRight size={15} weight="bold" />
            </Link>
          </div>
          {gamesStatus === "loading" ? (
            <div className="support-center__games-state" role="status">{t("Loading")}</div>
          ) : gamesStatus === "error" ? (
            <div className="support-center__games-state" role="alert">
              <span>{gamesError}</span>
              <button className="btn btn--secondary" type="button" onClick={retryGames}>{t("Try again")}</button>
            </div>
          ) : gameTiles.length ? (
            <div className="support-center__games-rail">
              {gameTiles.map((game) => {
                const cover = gameCover(game);
                const isSelected = gameKey(game) === selectedGameId;
                return (
                  <button
                    className={`support-center__game${isSelected ? " is-selected" : ""}`}
                    type="button"
                    key={gameKey(game)}
                    onClick={() => chooseGame(game)}
                    aria-pressed={isSelected}
                    title={t("Select this game for support")}
                  >
                    <span className="support-center__game-cover">
                      {cover ? <img src={cover} alt="" loading="lazy" /> : <span>{game.title}</span>}
                      {isSelected && <span className="support-center__game-selected"><ShieldCheck size={17} weight="fill" /></span>}
                    </span>
                    <strong>{game.title}</strong>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="support-center__empty">{t("support.noGames")}</p>
          )}
        </section>

        <section className="support-center__section" aria-labelledby="support-services-title">
          <div className="support-center__section-head">
            <h2 id="support-services-title">{t("support.services")}</h2>
          </div>
          <div className="support-center__services">
            {services.map(({ title, description, href, Icon }) => (
              <Link className="support-center__service" key={title} to={href}>
                <Icon size={30} weight="bold" />
                <strong>{t(title)}</strong>
                <span>{t(description)}</span>
                <ArrowUpRight className="support-center__service-arrow" size={16} weight="bold" />
              </Link>
            ))}
          </div>
        </section>

        <section className="support-center__section" aria-labelledby="support-articles-title">
          <div className="support-center__section-head">
            <div>
              <h2 id="support-articles-title">{t("support.featuredArticles")}</h2>
              <p>{t("support.articlesDescription")}</p>
            </div>
            <Link className="support-center__text-link" to="/newswire">
              {t("support.viewAll")} <ArrowRight size={15} weight="bold" />
            </Link>
          </div>
          {news.status === "loading" ? (
            <div className="support-center__articles-state" role="status">{t("Loading")}</div>
          ) : news.status === "error" ? (
            <div className="support-center__articles-state" role="alert">
              <span>{news.error}</span>
              <button className="btn btn--secondary" type="button" onClick={news.retry}>{t("Try again")}</button>
            </div>
          ) : filteredArticles.length ? (
            <div className="support-center__articles">
              {filteredArticles.map((article) => {
                const image = safeImageUrl(article.image);
                return (
                  <Link className="support-center__article" key={article.id} to={article.slug ? `/newswire/${encodeURIComponent(article.slug)}` : "/newswire"}>
                    {image && <span className="support-center__article-image"><img src={image} alt="" loading="lazy" /></span>}
                    <span className="support-center__article-meta">
                      <span>{article.category || t("News")}</span>
                      {article.published_at && <time dateTime={article.published_at}>{new Date(article.published_at).toLocaleDateString(language, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</time>}
                    </span>
                    <strong>{article.title}</strong>
                    {article.excerpt && <p>{article.excerpt}</p>}
                    <span className="support-center__article-action">{t("Read article")} <ArrowRight size={15} weight="bold" /></span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="support-center__empty">{t("support.noArticles")}</p>
          )}
        </section>

        <section className="support-center__search-panel" aria-labelledby="support-search-title">
          <div>
            <h2 id="support-search-title">{t("support.searchTitle")}</h2>
            <p>{t("support.searchDescription")}</p>
          </div>
          <label className="support-center__search-box">
            <MagnifyingGlass size={20} />
            <span className="sr-only">{t("Search support")}</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("support.searchPlaceholder")} />
            {search && <button type="button" onClick={() => setSearch("")} aria-label={t("Clear search")}>×</button>}
          </label>
          {search.trim() && (
            <div className="support-center__search-results" role="status">
              {searchResults.length ? searchResults.map((result, index) => {
                const content = (
                  <>
                    <span className="support-center__result-type">{result.type === "game" ? t("support.games") : result.type === "article" ? t("support.featuredArticles") : t("FAQ")}</span>
                    <strong>{result.title}</strong>
                    {result.description && <small>{result.description}</small>}
                  </>
                );
                if (result.type === "game") {
                  return <button className="support-center__search-result" type="button" key={`game-${gameKey(result.game)}`} onClick={() => chooseGame(result.game)}>{content}</button>;
                }
                if (result.type === "article") {
                  return <Link className="support-center__search-result" key={result.href + index} to={result.href}>{content}</Link>;
                }
                return <button className="support-center__search-result" type="button" key={result.title} onClick={() => startRequest(result.category)}>{content}</button>;
              }) : <p className="support-center__empty">{t("support.noSearchResults")}</p>}
            </div>
          )}
        </section>

        <section className="support-center__request" ref={requestRef} aria-labelledby="support-request-title">
          <div className="support-center__request-intro">
            <span className="support-center__eyebrow">{t("support.stillNeedHelp")}</span>
            <h2 id="support-request-title">{t("support.requestTitle")}</h2>
            <p>{t("support.requestDescription")}</p>
            <div className="support-center__request-note">
              <ShieldCheck size={19} weight="bold" />
              <span>{t("Tell us what happened. Please do not include passwords, tokens or payment details.")}</span>
            </div>
            <a href="mailto:deadsmilegames@gmail.com" className="support-center__email">
              <Envelope size={17} weight="bold" /> deadsmilegames@gmail.com
            </a>
          </div>
          <form className="support-center__request-form" onSubmit={submit}>
            <label>
              {t("support.selectGame")} <span aria-hidden="true">*</span>
              <select required value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)}>
                <option value="">{t("support.selectGamePlaceholder")}</option>
                {games.map((game) => (
                  <option value={gameKey(game)} key={gameKey(game)}>{game.title}</option>
                ))}
              </select>
              <small>{t("support.gameRequiredHint")}</small>
            </label>
            {selectedGame && (
              <div className="support-center__selected-game">
                {gameCover(selectedGame) && <img src={gameCover(selectedGame)} alt="" />}
                <span><small>{t("support.selectedGame")}</small><strong>{selectedGame.title}</strong></span>
                <ShieldCheck size={20} weight="fill" />
              </div>
            )}
            <label>
              {t("Email")} <span aria-hidden="true">*</span>
              <input type="email" required maxLength="254" value={form.email} onChange={change("email")} autoComplete="email" placeholder="voce@exemplo.com" />
            </label>
            <label>
              {t("Category")} <span aria-hidden="true">*</span>
              <select required value={form.category} onChange={change("category")}>
                <option value="technical">{t("Technical issue")}</option>
                <option value="account">{t("Account")}</option>
                <option value="purchase">{t("Purchase")}</option>
                <option value="game">{t("Game")}</option>
                <option value="faq">{t("FAQ")}</option>
                <option value="other">{t("Other")}</option>
              </select>
            </label>
            <label>
              {t("Message")} <span aria-hidden="true">*</span>
              <textarea required minLength="10" maxLength="4750" rows="5" value={form.message} onChange={change("message")} placeholder={t("What were you trying to do?")} />
            </label>
            <button className="btn btn--primary" type="submit" disabled={sending || gamesStatus !== "success" || !selectedGame}>
              <span>{sending ? t("Sending…") : t("support.submitRequest")}</span>
              <ArrowUpRight size={18} weight="bold" />
            </button>
            <small className="support-center__privacy-note">{t("support.formPrivacy")}</small>
          </form>
        </section>

        <section className="support-center__faq" aria-labelledby="support-faq-title">
          <div className="support-center__section-head">
            <div>
              <h2 id="support-faq-title">{t("FAQ")}</h2>
              <p>{t("support.faqDescription")}</p>
            </div>
          </div>
          <div className="support-center__faq-grid">
            {faqItems.map(([question, answer, category], index) => (
              <article className={openFaq === index ? "is-open" : ""} key={question}>
                <button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>
                  <span>{t(question)}</span><CaretDown size={18} weight="bold" />
                </button>
                {openFaq === index && <div><p>{t(answer)}</p><button type="button" className="support-center__text-link" onClick={() => startRequest(category)}>{t("support.getHelpAboutThis")} <ArrowRight size={15} /></button></div>}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
