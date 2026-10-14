import { useLanguage } from "../../context/LanguageContext";
import { SkeletonRows } from "../ui/Skeleton";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloudArrowDown, CloudArrowUp, FloppyDisk, Trash } from "@phosphor-icons/react";
import { api, friendlyErrorMessage } from "../../services/api";
import { ErrorState } from "../ui/ErrorState";
import { Button } from "../ui/Button";

const MAX_SAVE_BYTES = 1024;

function validarSavePico8(file, conteudo) {
  if (!/\.p8d\.txt$/i.test(file.name)) {
    throw { code: "SAVE_INVALID" };
  }

  if (file.size < 1 || file.size > MAX_SAVE_BYTES) {
    throw { code: "SAVE_TOO_LARGE" };
  }

  const linhas = conteudo.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");

  if (linhas.length !== 8 || !linhas.every((linha) => /^[0-9a-fA-F]{64}$/.test(linha))) {
    throw { code: "SAVE_INVALID" };
  }

  return true;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function safeFilePart(value) {
  return (
    String(value || "save")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "save"
  );
}

async function loadAllGames() {
  const first = await api.get("/games", { page: 1, limit: 48 });
  const items = [...(first?.items || [])];
  const totalPages = Math.min(Number(first?.pagination?.totalPages || 1), 25);
  for (let page = 2; page <= totalPages; page += 1) {
    const response = await api.get("/games", { page, limit: 48 });
    items.push(...(response?.items || []));
  }
  return items;
}

export function CloudSaves() {
  const { t, language } = useLanguage();
  const fileRef = useRef(null);
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState("");
  const [saves, setSaves] = useState([]);
  const [slot, setSlot] = useState("manual");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const saveRequest = useRef(0);
  const [savesLoading, setSavesLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const selectedGame = useMemo(
    () => games.find((game) => game.id === gameId) || null,
    [games, gameId],
  );

  const loadSaves = useCallback(async (selectedId) => {
    const id = ++saveRequest.current;
    if (!selectedId) {
      setSavesLoading(false);
      setSaves([]);
      return;
    }
    setSavesLoading(true);
    try {
      const data = await api.get(`/platform/saves/${encodeURIComponent(selectedId)}`);
      if (id === saveRequest.current) setSaves(Array.isArray(data) ? data : []);
    } catch (error) {
      if (id !== saveRequest.current) return;
      setSaves([]);
      setMessage({
        type: "error",
        text: friendlyErrorMessage(error),
      });
    } finally {
      if (id === saveRequest.current) setSavesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    Promise.all([loadAllGames(), api.get("/library")])
      .then(([catalog, library]) => {
        if (!active) return;
        const owned = new Map((library?.items || []).map((game) => [game.id, game]));
        const available = new Map();
        for (const game of catalog) {
          if (game.cloudSavesEnabled && (!game.commerceEnabled || owned.has(game.id)))
            available.set(game.id, game);
        }
        for (const game of owned.values()) {
          if (game.cloudSavesEnabled)
            available.set(game.id, {
              ...available.get(game.id),
              ...game,
            });
        }
        const next = [...available.values()].sort((a, b) =>
          String(a.title).localeCompare(String(b.title)),
        );
        setGames(next);
        setGameId((current) =>
          next.some((game) => game.id === current) ? current : next[0]?.id || "",
        );
      })
      .catch((error) => {
        if (active) setLoadError(friendlyErrorMessage(error));
        if (active)
          setMessage({
            type: "error",
            text: friendlyErrorMessage(error),
          });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);

  useEffect(() => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setMessage({ type: "", text: "" });
    setSaves([]);
    loadSaves(gameId);
    return () => {
      saveRequest.current += 1;
    };
  }, [gameId, loadSaves]);

  async function downloadSave(item) {
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      const data = await api.get(
        `/platform/saves/${encodeURIComponent(gameId)}/${encodeURIComponent(item.slot)}`,
      );
      const bytes = base64ToBytes(data.payload);
      const blob = new Blob([bytes], {
        type: "application/octet-stream",
      });
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `${`${safeFilePart(selectedGame?.slug || selectedGame?.title)}-${safeFilePart(item.slot)}`.replaceAll(".", "-").slice(0, 64)}.p8d.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 0);
      setMessage({ type: "success", text: t("Downloaded {0}.", { 0: item.slot }) });
    } catch (error) {
      setMessage({
        type: "error",
        text: friendlyErrorMessage(error),
      });
    } finally {
      setBusy(false);
    }
  }

  async function uploadSave(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    if (!gameId || !file) {
      setMessage({
        type: "error",
        text: friendlyErrorMessage({ code: "VALIDATION_ERROR" }),
      });
      return;
    }
    if (!/^[a-z0-9_-]{1,40}$/.test(slot)) {
      setMessage({
        type: "error",
        text: friendlyErrorMessage({ code: "VALIDATION_ERROR" }),
      });
      return;
    }
    setBusy(true);
    try {
      const conteudo = await file.text();
      validarSavePico8(file, conteudo);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const existing = saves.find((item) => item.slot === slot);
      await api.put(
        `/platform/saves/${encodeURIComponent(gameId)}/${encodeURIComponent(slot)}`,
        {
          filename: file.name,
          payload: bytesToBase64(bytes),
          revision: existing?.revision ?? null,
        },
      );
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadSaves(gameId);
      setMessage({
        type: "success",
        text: existing ? t("Updated {0}.", { 0: slot }) : t("Uploaded {0}.", { 0: slot }),
      });
    } catch (error) {
      if (error?.code === "SAVE_CONFLICT") await loadSaves(gameId);
      setMessage({
        type: "error",
        text: friendlyErrorMessage(error),
      });
    } finally {
      setBusy(false);
    }
  }

  async function deleteSave(item) {
    if (
      !window.confirm(
        t("Delete cloud save \u201C{0}\u201D? This cannot be undone.", { 0: item.slot }),
      )
    )
      return;
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      await api.delete(
        `/platform/saves/${encodeURIComponent(gameId)}/${encodeURIComponent(item.slot)}`,
      );
      await loadSaves(gameId);
      setMessage({ type: "success", text: t("Deleted {0}.", { 0: item.slot }) });
    } catch (error) {
      setMessage({
        type: "error",
        text: friendlyErrorMessage(error),
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div className="account-panel account-panel--placeholder">
        <CloudArrowUp weight="bold" />
        <SkeletonRows count={2} />
      </div>
    );

  if (loadError)
    return (
      <ErrorState message={loadError} onRetry={() => setRevision((value) => value + 1)} />
    );

  if (!games.length)
    return (
      <div className="account-panel account-panel--placeholder">
        <FloppyDisk weight="bold" />
        <p>{t("No games in your library currently support cloud saves.")}</p>
      </div>
    );

  return (
    <div className="cloud-saves">
      <div className="account-panel">
        <div className="account-row">
          <label htmlFor="cloud-game">{t("Game")}</label>
          <select
            id="cloud-game"
            disabled={busy || savesLoading}
            value={gameId}
            onChange={(event) => {
              setGameId(event.target.value);
              setMessage({ type: "", text: "" });
            }}
          >
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.title}
              </option>
            ))}
          </select>
        </div>
        <form onSubmit={uploadSave}>
          <div className="account-row">
            <label htmlFor="cloud-slot">{t("Save slot")}</label>
            <input
              id="cloud-slot"
              disabled={busy}
              value={slot}
              maxLength={40}
              pattern="[a-z0-9_-]{1,40}"
              onChange={(event) =>
                setSlot(
                  event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_-]/g, "")
                    .slice(0, 40),
                )
              }
              required
            />
          </div>
          <div className="account-row account-row--last">
            <label htmlFor="cloud-file">
              {t("Save file \xB7 .p8d.txt only \xB7 max 1 KiB")}
            </label>
            <input
              ref={fileRef}
              id="cloud-file"
              disabled={busy}
              type="file"
              accept=".p8d.txt"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null;
                setFile(null);
                setMessage({ type: "", text: "" });

                if (!selectedFile) return;

                if (!/\.p8d\.txt$/i.test(selectedFile.name)) {
                  setMessage({
                    type: "error",
                    text: friendlyErrorMessage({ code: "SAVE_INVALID" }),
                  });
                  event.target.value = "";
                  return;
                }

                setFile(selectedFile);
              }}
              required
            />
          </div>
          <div className="account-block__foot">
            <Button type="submit" variant="secondary" disabled={busy || !file}>
              <CloudArrowUp weight="bold" />
              {busy ? t("Syncing\u2026") : t("Upload save")}
            </Button>
          </div>
        </form>
      </div>

      <div className="account-panel cloud-save-list" aria-busy={savesLoading}>
        {savesLoading ? (
          <div className="account-row account-row--last">
            <SkeletonRows count={2} />
          </div>
        ) : saves.length ? (
          saves.map((item, index) => (
            <div
              className={`account-row--inline${index === saves.length - 1 ? " account-row--last" : ""}`}
              style={{
                padding: "40px",
                background: "#ffffff0a",
                marginTop: "20px",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              key={item.slot}
            >
              <div className="cloud-save-meta">
                <strong>{item.slot}</strong>
                <p>
                  {t("Revision ")}
                  {item.revision} · {new Date(item.updated_at).toLocaleString(language)}
                </p>
                <small>SHA-256 {String(item.sha256 || "").slice(0, 16)}…</small>
              </div>
              <div className="connection-row__actions">
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy}
                  onClick={() => downloadSave(item)}
                >
                  <CloudArrowDown weight="bold" />
                  {t("Download")}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={busy}
                  onClick={() => deleteSave(item)}
                >
                  <Trash weight="bold" />
                  {t("Delete")}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="account-row account-row--last">
            <p>{t("No cloud saves stored for this game yet.")}</p>
          </div>
        )}
      </div>
      {message.text && (
        <p
          className={
            message.type === "error" ? "account-page__error" : "account-page__success"
          }
          role="status"
        >
          {t(message.text)}
        </p>
      )}
    </div>
  );
}
