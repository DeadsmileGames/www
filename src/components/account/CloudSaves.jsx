import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    CloudArrowDown,
    CloudArrowUp,
    FloppyDisk,
    Trash,
} from "@phosphor-icons/react";
import { api } from "../../services/api";
import { Button } from "../ui/Button";

const MAX_SAVE_BYTES = 256 * 1024;

function bytesToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(
            ...bytes.subarray(offset, offset + chunkSize),
        );
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
    const fileRef = useRef(null);
    const [games, setGames] = useState([]);
    const [gameId, setGameId] = useState("");
    const [saves, setSaves] = useState([]);
    const [slot, setSlot] = useState("manual");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savesLoading, setSavesLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const selectedGame = useMemo(
        () => games.find((game) => game.id === gameId) || null,
        [games, gameId],
    );

    const loadSaves = useCallback(async (selectedId) => {
        if (!selectedId) {
            setSaves([]);
            return;
        }
        setSavesLoading(true);
        try {
            const data = await api.get(
                `/platform/saves/${encodeURIComponent(selectedId)}`,
            );
            setSaves(Array.isArray(data) ? data : []);
        } catch (error) {
            setSaves([]);
            setMessage({
                type: "error",
                text: error?.message || "Cloud saves could not be loaded.",
            });
        } finally {
            setSavesLoading(false);
        }
    }, []);

    useEffect(() => {
        let active = true;
        Promise.all([loadAllGames(), api.get("/library")])
            .then(([catalog, library]) => {
                if (!active) return;
                const owned = new Map(
                    (library?.items || []).map((game) => [game.id, game]),
                );
                const available = new Map();
                for (const game of catalog) {
                    if (
                        game.cloudSavesEnabled &&
                        (!game.commerceEnabled || owned.has(game.id))
                    )
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
                setGameId((current) => current || next[0]?.id || "");
            })
            .catch((error) => {
                if (active)
                    setMessage({
                        type: "error",
                        text:
                            error?.message ||
                            "Your cloud-save library could not be loaded.",
                    });
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        loadSaves(gameId);
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
            anchor.download = `${safeFilePart(selectedGame?.slug || selectedGame?.title)}-${safeFilePart(item.slot)}.cloudsave`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(href), 0);
            setMessage({ type: "success", text: `Downloaded ${item.slot}.` });
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error?.message ||
                    "This cloud save could not be downloaded.",
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
                text: "Choose a game and a save file first.",
            });
            return;
        }
        if (!/^[a-z0-9_-]{1,40}$/.test(slot)) {
            setMessage({
                type: "error",
                text: "Slot names may use lowercase letters, numbers, underscores and hyphens.",
            });
            return;
        }
        if (file.size < 1 || file.size > MAX_SAVE_BYTES) {
            setMessage({
                type: "error",
                text: "Cloud save files must be 256 KiB or smaller.",
            });
            return;
        }
        setBusy(true);
        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const existing = saves.find((item) => item.slot === slot);
            await api.put(
                `/platform/saves/${encodeURIComponent(gameId)}/${encodeURIComponent(slot)}`,
                {
                    payload: bytesToBase64(bytes),
                    revision: existing?.revision ?? null,
                },
            );
            setFile(null);
            if (fileRef.current) fileRef.current.value = "";
            await loadSaves(gameId);
            setMessage({
                type: "success",
                text: existing ? `Updated ${slot}.` : `Uploaded ${slot}.`,
            });
        } catch (error) {
            if (error?.code === "SAVE_CONFLICT") await loadSaves(gameId);
            setMessage({
                type: "error",
                text:
                    error?.message || "This cloud save could not be uploaded.",
            });
        } finally {
            setBusy(false);
        }
    }

    async function deleteSave(item) {
        if (
            !window.confirm(
                `Delete cloud save “${item.slot}”? This cannot be undone.`,
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
            setMessage({ type: "success", text: `Deleted ${item.slot}.` });
        } catch (error) {
            setMessage({
                type: "error",
                text: error?.message || "This cloud save could not be deleted.",
            });
        } finally {
            setBusy(false);
        }
    }

    if (loading)
        return (
            <div className="account-panel account-panel--placeholder">
                <CloudArrowUp weight="bold" />
                <p>Loading your cloud-save library…</p>
            </div>
        );
    if (!games.length)
        return (
            <div className="account-panel account-panel--placeholder">
                <FloppyDisk weight="bold" />
                <p>No games in your library currently support cloud saves.</p>
            </div>
        );

    return (
        <div className="cloud-saves">
            <div className="account-panel">
                <div className="account-row">
                    <label htmlFor="cloud-game">Game</label>
                    <select
                        id="cloud-game"
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
                        <label htmlFor="cloud-slot">Save slot</label>
                        <input
                            id="cloud-slot"
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
                            Save file · max 256 KiB
                        </label>
                        <input
                            ref={fileRef}
                            id="cloud-file"
                            type="file"
                            onChange={(event) =>
                                setFile(event.target.files?.[0] || null)
                            }
                            required
                        />
                    </div>
                    <div className="account-block__foot">
                        <Button
                            type="submit"
                            variant="secondary"
                            disabled={busy || !file}
                        >
                            <CloudArrowUp weight="bold" />
                            {busy ? "Syncing…" : "Upload save"}
                        </Button>
                    </div>
                </form>
            </div>

            <div
                className="account-panel cloud-save-list"
                aria-busy={savesLoading}
            >
                {savesLoading ? (
                    <div className="account-row account-row--last">
                        <p>Loading saves…</p>
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
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                            key={item.slot}
                        >
                            <div className="cloud-save-meta">
                                <strong>{item.slot}</strong>
                                <p>
                                    Revision {item.revision} ·{" "}
                                    {new Date(item.updated_at).toLocaleString()}
                                </p>
                                <small>
                                    SHA-256{" "}
                                    {String(item.sha256 || "").slice(0, 16)}…
                                </small>
                            </div>
                            <div className="connection-row__actions">
                                <Button
                                    type="button"
                                    variant="primary"
                                    disabled={busy}
                                    onClick={() => downloadSave(item)}
                                >
                                    <CloudArrowDown weight="bold" />
                                    Download
                                </Button>
                                <Button
                                    type="button"
                                    variant="danger"
                                    disabled={busy}
                                    onClick={() => deleteSave(item)}
                                >
                                    <Trash weight="bold" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="account-row account-row--last">
                        <p>No cloud saves stored for this game yet.</p>
                    </div>
                )}
            </div>
            {message.text && (
                <p
                    className={
                        message.type === "error"
                            ? "account-page__error"
                            : "account-page__success"
                    }
                    role="status"
                >
                    {message.text}
                </p>
            )}
        </div>
    );
}
