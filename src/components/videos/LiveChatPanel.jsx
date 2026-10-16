import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { AutoLinkText } from "../ui/AutoLinkText";
import { api } from "../../services/api";
import { safeImageUrl } from "../../utils/urls";

const initialState = { status: "loading", messages: [], pollingIntervalMillis: 15000 };

export function LiveChatPanel({ videoId, videoState, onBroadcastEnded }) {
  const { t, language } = useLanguage();
  const [chat, setChat] = useState(initialState);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (!videoId || !["live", "upcoming"].includes(videoState)) {
      setChat(initialState);
      return undefined;
    }

    let active = true;
    let timer = null;
    setChat(initialState);

    async function poll() {
      try {
        const data = await api.get(`/videos/${encodeURIComponent(videoId)}/live-chat`);
        if (!active) return;

        if (
          data?.state === "completed" ||
          (videoState === "live" && data?.state === "none")
        ) {
          onBroadcastEnded?.();
          return;
        }

        const messages = Array.isArray(data?.messages) ? data.messages.slice(-80) : [];
        const status =
          data?.state === "upcoming" && !data?.available
            ? "waiting"
            : data?.available
              ? "ready"
              : "unavailable";
        const delay = Math.min(
          30000,
          Math.max(5000, Number(data?.pollingIntervalMillis) || 15000),
        );
        setChat({ status, messages, pollingIntervalMillis: delay });
        timer = window.setTimeout(poll, delay);
      } catch {
        if (!active) return;
        setChat((current) => ({
          status: current.messages.length ? "ready" : "unavailable",
          messages: current.messages,
          pollingIntervalMillis: 15000,
        }));
        timer = window.setTimeout(poll, 15000);
      }
    }

    void poll();
    return () => {
      active = false;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [videoId, videoState, onBroadcastEnded]);

  useEffect(() => {
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat.messages.length, videoId]);

  const statusLabel = videoState === "live" ? "Live now" : "Premiere";

  return (
    <section
      className="video-overlay__description-panel support-card video-overlay__live-chat"
      aria-labelledby="video-overlay-live-chat-title"
    >
      <header className="video-overlay__live-chat-header">
        <h3 id="video-overlay-live-chat-title">{t("Live chat")}</h3>
        <span className="video-overlay__chat-status">{t(statusLabel)}</span>
      </header>
      <div
        className="video-overlay__live-chat-messages"
        ref={messagesRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label={t("Live chat messages")}
      >
        {chat.status === "loading" && (
          <p className="video-overlay__live-chat-state">{t("Loading chat…")}</p>
        )}
        {chat.status === "waiting" && (
          <p className="video-overlay__live-chat-state">
            {t("Chat will appear when the premiere starts.")}
          </p>
        )}
        {chat.status === "unavailable" && (
          <p className="video-overlay__live-chat-state">
            {t("Live chat is temporarily unavailable.")}
          </p>
        )}
        {chat.status === "ready" && chat.messages.length === 0 && (
          <p className="video-overlay__live-chat-state">{t("No messages yet.")}</p>
        )}
        {chat.messages.map((message) => {
          const photo = safeImageUrl(message.authorPhoto);
          const time =
            message.publishedAt && Number.isFinite(Date.parse(message.publishedAt))
              ? new Date(message.publishedAt).toLocaleTimeString(language, {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;
          return (
            <article className="video-overlay__chat-message" key={message.id}>
              {photo ? (
                <img
                  className="video-overlay__chat-avatar"
                  src={photo}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="video-overlay__chat-avatar video-overlay__chat-avatar--fallback" aria-hidden="true">
                  {(message.authorName || "?").slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="video-overlay__chat-message-copy">
                <header>
                  <strong>{message.authorName}</strong>
                  {time && <time dateTime={message.publishedAt}>{time}</time>}
                </header>
                <p><AutoLinkText>{message.message}</AutoLinkText></p>
              </div>
            </article>
          );
        })}
      </div>
      <p className="video-overlay__live-chat-footnote">{t("Read-only chat from YouTube.")}</p>
    </section>
  );
}
