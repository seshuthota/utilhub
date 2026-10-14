'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
    Play, Trash2, X, Loader2, Network, Braces, History as HistoryIcon, Code, Save, Square, FolderOpen, Link2,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useHistory } from "@/hooks/useHistory";
import { useEnvironments, substituteVariables } from "@/hooks/useEnvironments";
import { useHotkeys } from "@/hooks/useHotkeys";
import {
    type RequestState,
    type ResponseData,
    findUnresolvedVariables,
    migrateRequestState,
    stripFilePayloads,
    requestStateFromCurl,
} from "@/utils/apiClientRequest";
import {
    type SendMode,
    compactResponseForHistory,
    sendRequest,
} from "@/utils/apiClientSend";
import {
    type CollectionsState,
    type SavedRequest,
    loadCollections,
    makeSavedRequest,
    mergeCollections,
    newId,
    saveCollections,
} from "@/utils/apiClientStore";
import { type ImportResult, decodeShareHash, encodeShareHash } from "@/utils/apiClientInterop";
import { generateSnippets, type SnippetLang } from "@/utils/codeSnippets";
import RequestBuilder from "@/components/common/RequestBuilder";
import ResponseViewer from "@/components/common/ResponseViewer";
import HistorySidebar from "@/components/common/HistorySidebar";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import EnvironmentManager from "./EnvironmentManager";
import CollectionsSidebar from "./CollectionsSidebar";
import ImportExportModal from "./ImportExportModal";
import styles from "./page.module.css";

const HISTORY_KEY = "utilhub_curl_tester_history";
const SEND_MODE_KEY = "utilhub_curl_tester_send_mode";
const NEW_FOLDER = "__new__";

function loadSendMode(): SendMode {
    try {
        const v = localStorage.getItem(SEND_MODE_KEY);
        if (v === "proxy" || v === "browser" || v === "local") return v;
    } catch { /* ignore */ }
    // Privacy-first default: requests leave from the user's own browser/network.
    return "browser";
}

interface HistoryEntry {
    method: string;
    url: string;
    timestamp: number;
    status?: number;
    request: RequestState;
    response?: ResponseData;
}

const EXAMPLE: RequestState = {
    method: "POST",
    url: "https://jsonplaceholder.typicode.com/posts",
    params: [],
    headers: [
        { key: "Content-Type", value: "application/json", active: true },
    ],
    auth: { type: "none" },
    bodyMode: "json",
    body: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}',
    formFields: [],
};

const EMPTY: RequestState = {
    method: "GET",
    url: "",
    params: [],
    headers: [],
    auth: { type: "none" },
    bodyMode: "none",
    body: "",
    formFields: [],
};

function methodBadgeStyle(method: string): React.CSSProperties {
    const colors: Record<string, string> = {
        GET: "#22c55e", POST: "#3b82f6", PUT: "#f59e0b",
        PATCH: "#a855f7", DELETE: "#ef4444", HEAD: "#64748b", OPTIONS: "#64748b",
    };
    return {
        color: colors[method] || "#fff",
        fontWeight: 700,
        fontSize: "0.7rem",
        marginRight: "0.5rem",
        minWidth: "42px",
    };
}

export default function CurlTester() {
    const [request, setRequest] = useState<RequestState>(EXAMPLE);
    const [response, setResponse] = useState<ResponseData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showCurlModal, setShowCurlModal] = useState(false);
    const [curlInput, setCurlInput] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const { history, addToHistory, clearHistory, removeFromHistory } = useHistory<HistoryEntry>(HISTORY_KEY, 50);
    const env = useEnvironments();
    const { showToast } = useToast();
    const abortRef = useRef<AbortController | null>(null);

    const [showSnippets, setShowSnippets] = useState(false);
    const [showEnvManager, setShowEnvManager] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveName, setSaveName] = useState("");
    const [saveFolder, setSaveFolder] = useState<string>("");
    const [newFolderName, setNewFolderName] = useState("");
    const [collections, setCollections] = useState<CollectionsState>(() => loadCollections());
    /** Saved request currently loaded in the editor (enables "Update" on save). */
    const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
    const [showCollections, setShowCollections] = useState(false);
    const [showImportExport, setShowImportExport] = useState(false);
    const [snippetLang, setSnippetLang] = useState<SnippetLang>("curl");
    /**
     * browser = direct from your browser (default; needs CORS on the API)
     * local   = local Node proxy on :3927 (your machine; run `npm run proxy:local`)
     * proxy   = UtilHub's hosted route — opt-in only, request passes through UtilHub servers
     */
    const [sendMode, setSendMode] = useState<SendMode>("browser");

    useEffect(() => {
        setSendMode(loadSendMode());
    }, []);

    // Open a request shared via link (#req=…); the hash never reaches any server.
    useEffect(() => {
        const shared = decodeShareHash(window.location.hash);
        if (!shared) return;
        setRequest(shared);
        setActiveSavedId(null);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        showToast("Loaded shared request", "info");
    }, [showToast]);

    const activeEnv = env.getActiveEnvironment();
    const resolve = useCallback(
        (text: string) =>
            activeEnv ? substituteVariables(text, activeEnv.variables) : text,
        [activeEnv],
    );

    const unresolved = useMemo(() => findUnresolvedVariables(request, resolve), [request, resolve]);
    const activeSaved = collections.requests.find((r) => r.id === activeSavedId) || null;

    const updateCollections = useCallback(
        (next: CollectionsState) => {
            setCollections(next);
            if (!saveCollections(next)) {
                showToast("Could not save collections — browser storage is full", "error");
            }
        },
        [showToast],
    );

    const handleSendModeChange = (mode: SendMode) => {
        setSendMode(mode);
        try {
            localStorage.setItem(SEND_MODE_KEY, mode);
        } catch { /* ignore */ }
        if (mode === "local") {
            showToast("Start local proxy with: npm run proxy:local", "success");
        } else if (mode === "proxy") {
            showToast(
                "Requests will pass through UtilHub's server",
                "info",
                "Use Browser or your Local proxy to keep requests on your own network.",
            );
        }
    };

    const handleSend = useCallback(async () => {
        if (!request.url.trim()) {
            showToast("Enter a URL first", "error");
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        setResponse(null);
        setError(null);

        try {
            const result = await sendRequest(request, resolve, sendMode, controller.signal);
            if (controller.signal.aborted) return;

            if (!result.response) {
                setError(result.error || "Request failed");
                showToast(result.rawError || result.error || "Request failed", "error");
                return;
            }

            const data = result.response;
            setResponse(data);
            if (result.error) setError(result.error);
            addToHistory({
                method: request.method,
                url: request.url,
                timestamp: Date.now(),
                status: data.status,
                request: stripFilePayloads(JSON.parse(JSON.stringify(request))),
                response: compactResponseForHistory(data),
            });
            if (data.status) {
                showToast(`${data.status} in ${data.time}ms`, data.status < 400 ? "success" : "error");
            }
        } catch (e: unknown) {
            if (e instanceof DOMException && e.name === "AbortError") {
                showToast("Request cancelled", "error");
                setError("Request cancelled");
                return;
            }
            const message = e instanceof Error ? e.message : "Request failed";
            setError(message);
            showToast(message, "error");
        } finally {
            if (abortRef.current === controller) {
                abortRef.current = null;
            }
            setIsLoading(false);
        }
    }, [request, resolve, showToast, addToHistory, sendMode]);

    const handleCancel = () => {
        abortRef.current?.abort();
        abortRef.current = null;
        setIsLoading(false);
        showToast("Request cancelled", "error");
        setError("Request cancelled");
    };

    useHotkeys("Enter", () => {
        if (!isLoading) handleSend();
    }, { meta: true });

    const handleImportCurl = () => {
        setShowCurlModal(true);
        setCurlInput("");
    };

    const applyCurlImport = () => {
        const { request: next, error: parseError } = requestStateFromCurl(curlInput);
        if (parseError || !next) {
            showToast(parseError || "Failed to parse cURL", "error");
            return;
        }
        setRequest(next);
        setActiveSavedId(null);
        setShowCurlModal(false);
        showToast("cURL parsed successfully", "success");
    };

    const handleCurlAutoImport = useCallback(
        (result: { ok: boolean; message?: string }) => {
            if (result.ok) {
                setActiveSavedId(null);
                showToast(result.message || "cURL imported", "success");
            } else {
                showToast(result.message || "Failed to parse cURL", "error");
            }
        },
        [showToast],
    );

    const clearAll = () => {
        setRequest(EMPTY);
        setResponse(null);
        setError(null);
        setActiveSavedId(null);
    };

    const copyResponseBody = () => {
        if (!response) return;
        if (response.encoding === "base64" && typeof response.data === "string") {
            navigator.clipboard.writeText(response.data);
        } else {
            const text =
                typeof response.data === "string"
                    ? response.data
                    : JSON.stringify(response.data, null, 2);
            navigator.clipboard.writeText(text);
        }
        showToast("Response body copied", "success");
    };

    const loadFromHistory = (entry: HistoryEntry) => {
        setRequest(migrateRequestState(entry.request || {}));
        setResponse(entry.response || null);
        setError(null);
        setActiveSavedId(null);
        setShowHistory(false);
    };

    const loadSaved = (item: SavedRequest) => {
        setRequest(migrateRequestState(item.request || {}));
        setResponse(null);
        setError(null);
        setActiveSavedId(item.id);
        setShowCollections(false);
    };

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString();
    };

    const resolveSaveFolder = (state: CollectionsState): { state: CollectionsState; folderId: string | null } => {
        if (saveFolder !== NEW_FOLDER) return { state, folderId: saveFolder || null };
        const folder = { id: newId(), name: newFolderName.trim() || "New folder" };
        return { state: { ...state, folders: [...state.folders, folder] }, folderId: folder.id };
    };

    const handleSaveRequest = () => {
        if (!saveName.trim()) return;
        const { state, folderId } = resolveSaveFolder(collections);
        const item = makeSavedRequest(saveName.trim(), folderId, request);
        updateCollections({ ...state, requests: [item, ...state.requests] });
        setActiveSavedId(item.id);
        setShowSaveModal(false);
        setSaveName("");
        showToast("Request saved", "success");
    };

    const handleUpdateSaved = () => {
        if (!activeSaved || !saveName.trim()) return;
        const { state, folderId } = resolveSaveFolder(collections);
        const updated = makeSavedRequest(saveName.trim(), folderId, request);
        updateCollections({
            ...state,
            requests: state.requests.map((r) =>
                r.id === activeSaved.id ? { ...updated, id: activeSaved.id } : r,
            ),
        });
        setShowSaveModal(false);
        showToast(`Updated “${saveName.trim()}”`, "success");
    };

    const openSaveModal = () => {
        setSaveName(
            activeSaved?.name ||
                request.url.replace(/https?:\/\//, "").split(/[?#]/)[0] ||
                "Untitled",
        );
        setSaveFolder(activeSaved?.folderId || "");
        setNewFolderName("");
        setShowSaveModal(true);
    };

    useHotkeys("s", () => openSaveModal(), { meta: true });

    const handleImport = (result: ImportResult) => {
        updateCollections(mergeCollections(collections, result));
        env.importEnvironments(result.environments);
        setShowImportExport(false);
        const parts = [
            result.requests.length && `${result.requests.length} requests`,
            result.environments.length && `${result.environments.length} environments`,
        ].filter(Boolean);
        showToast(`Imported ${parts.join(" and ") || "nothing"}`, "success");
    };

    const handleShare = async () => {
        const { hash, redacted } = encodeShareHash(request);
        const url = `${window.location.origin}${window.location.pathname}${hash}`;
        try {
            await navigator.clipboard.writeText(url);
            showToast(
                "Share link copied",
                "success",
                redacted > 0
                    ? `${redacted} secret value${redacted === 1 ? " was" : "s were"} removed. {{variables}} are kept; environments are never shared.`
                    : "Environment values are never included.",
            );
        } catch {
            showToast("Could not copy link to clipboard", "error");
        }
    };

    const snippets = generateSnippets(request, resolve);
    const snippetLabels: Record<SnippetLang, string> = {
        curl: "cURL",
        fetch: "JavaScript (fetch)",
        python: "Python",
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <Network size={24} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                    API Client
                </h1>
                <div className={styles.actions}>
                    {activeSaved && (
                        <span className={styles.savedBadge} title="Loaded from collections">
                            {activeSaved.name}
                        </span>
                    )}
                    <button
                        className={styles.button}
                        onClick={() => { setShowSnippets(true); setSnippetLang("curl"); }}
                        title="View code snippets"
                    >
                        <Code size={16} /> Code
                    </button>
                    <button
                        className={styles.button}
                        onClick={handleShare}
                        title="Copy a shareable link (secrets removed)"
                        disabled={!request.url.trim()}
                    >
                        <Link2 size={16} /> Share
                    </button>
                    <button
                        className={styles.button}
                        onClick={() => setShowHistory(true)}
                        title="History"
                    >
                        <HistoryIcon size={16} /> History
                    </button>
                    <button
                        className={styles.button}
                        onClick={openSaveModal}
                        title="Save request"
                    >
                        <Save size={16} /> Save
                    </button>
                    <button
                        className={styles.button}
                        onClick={() => setShowCollections(true)}
                        title="Saved requests"
                    >
                        <FolderOpen size={16} /> Collections
                    </button>
                    {env.environments.length > 0 && (
                        <select
                            className={styles.envSelect}
                            value={env.activeEnvId || ""}
                            onChange={(e) => env.setActiveEnvId(e.target.value || null)}
                            title="Active environment"
                            aria-label="Active environment"
                        >
                            <option value="">No env</option>
                            {env.environments.map((e) => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                    )}
                    <button
                        className={styles.button}
                        onClick={() => setShowEnvManager(true)}
                        title="Manage environments"
                    >
                        {activeEnv?.name || "Env"}
                    </button>
                    <button
                        className={styles.button}
                        onClick={() => { setRequest(EXAMPLE); setActiveSavedId(null); }}
                        title="Load example"
                    >
                        <Braces size={16} /> Example
                    </button>
                    <button className={styles.button} onClick={clearAll} title="Clear all">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            <div className={styles.requestPane}>
                <RequestBuilder
                    value={request}
                    onChange={setRequest}
                    onImportCurl={handleImportCurl}
                    onCurlAutoImport={handleCurlAutoImport}
                />
                {unresolved.length > 0 && (
                    <div className={styles.unresolvedBanner} role="status">
                        <span>
                            {activeEnv ? `Not defined in “${activeEnv.name}”:` : "No environment selected for:"}{" "}
                            {unresolved.map((name) => (
                                <code key={name}>{`{{${name}}}`} </code>
                            ))}
                            — sent literally.
                        </span>
                        <button className={styles.linkBtn} onClick={() => setShowEnvManager(true)}>
                            Manage environments
                        </button>
                    </div>
                )}
                <div className={styles.sendRow}>
                    <span className={styles.shortcutHint}>Ctrl/⌘ + Enter</span>
                    {sendMode === "proxy" && (
                        <span className={styles.proxyWarning} role="note">
                            Sent through UtilHub&apos;s server
                        </span>
                    )}
                    <label
                        className={styles.sendModeLabel}
                        title="Browser: straight from your browser (the API must allow CORS). Local proxy: your own machine via npm run proxy:local — no CORS limits, reaches localhost. UtilHub proxy: opt-in, passes through UtilHub's server (public hosts only)."
                    >
                        <span className={styles.sendModeText}>Send via</span>
                        <select
                            className={styles.sendModeSelect}
                            value={sendMode}
                            onChange={(e) => handleSendModeChange(e.target.value as SendMode)}
                            aria-label="Send mode"
                            disabled={isLoading}
                        >
                            <option value="browser">Browser (direct)</option>
                            <option value="local">Local proxy (:3927)</option>
                            <option value="proxy">UtilHub proxy (via our server)</option>
                        </select>
                    </label>
                    {isLoading ? (
                        <button
                            className={styles.cancelBtn}
                            onClick={handleCancel}
                            aria-label="Cancel request"
                        >
                            <Square size={14} /> Cancel
                        </button>
                    ) : null}
                    <button
                        className={styles.primaryBtn}
                        onClick={handleSend}
                        disabled={!request.url.trim() || isLoading}
                        aria-label="Send request"
                    >
                        {isLoading ? (
                            <><Loader2 size={16} className="animate-spin" /> Sending...</>
                        ) : (
                            <><Play size={16} /> Send</>
                        )}
                    </button>
                </div>
            </div>

            <div className={styles.responsePane}>
                <ResponseViewer
                    response={response}
                    error={error || undefined}
                    onCopyBody={copyResponseBody}
                />
            </div>

            <HistorySidebar
                history={history}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                onSelect={loadFromHistory}
                onClear={clearHistory}
                onDelete={removeFromHistory}
                renderItem={(item: HistoryEntry) => (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={methodBadgeStyle(item.method)}>{item.method}</span>
                            <span style={{
                                fontSize: "0.8rem",
                                color: "var(--text-primary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}>
                                {item.url}
                            </span>
                        </div>
                        <div style={{
                            fontSize: "0.7rem",
                            color: "var(--text-secondary)",
                            display: "flex",
                            gap: "0.5rem",
                        }}>
                            <span>{formatTime(item.timestamp)}</span>
                            {item.status && (
                                <span style={{
                                    color: item.status < 300 ? "#22c55e" :
                                        item.status < 400 ? "#3b82f6" :
                                        item.status < 500 ? "#f59e0b" : "#ef4444",
                                }}>
                                    {item.status}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            />

            <CollectionsSidebar
                isOpen={showCollections}
                onClose={() => setShowCollections(false)}
                collections={collections}
                onChange={updateCollections}
                onLoad={loadSaved}
                activeRequestId={activeSavedId}
                onImportExport={() => { setShowCollections(false); setShowImportExport(true); }}
            />

            {showImportExport && (
                <ImportExportModal
                    collections={collections}
                    environments={env.environments}
                    onImport={handleImport}
                    onClose={() => setShowImportExport(false)}
                />
            )}

            {showSnippets && (
                <div className={styles.modalOverlay} onClick={() => setShowSnippets(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "720px" }}>
                        <div className={styles.modalHeader}>
                            <h3>Code Snippets</h3>
                            <button className={styles.closeBtn} onClick={() => setShowSnippets(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p className={styles.modalHint}>
                                Snippets use resolved environment values. Avoid sharing if they contain secrets.
                            </p>
                            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                                {(Object.entries(snippetLabels) as [SnippetLang, string][]).map(([key, label]) => (
                                    <button
                                        key={key}
                                        className={snippetLang === key ? styles.primaryBtn : styles.button}
                                        onClick={() => setSnippetLang(key)}
                                        style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <div style={{ position: "relative" }}>
                                <CodeMirrorEditor
                                    value={snippets[snippetLang]}
                                    language={
                                        snippetLang === "python" ? "python" :
                                        snippetLang === "fetch" ? "javascript" : "bash"
                                    }
                                    readOnly
                                    height="250px"
                                />
                                <button
                                    className={styles.button}
                                    onClick={() => {
                                        navigator.clipboard.writeText(snippets[snippetLang]);
                                        showToast("Snippet copied!", "success");
                                    }}
                                    style={{ position: "absolute", top: "0.5rem", right: "0.5rem", fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <EnvironmentManager
                isOpen={showEnvManager}
                onClose={() => setShowEnvManager(false)}
                environments={env.environments}
                activeEnvId={env.activeEnvId}
                setActiveEnvId={env.setActiveEnvId}
                addEnvironment={env.addEnvironment}
                updateEnvironment={env.updateEnvironment}
                deleteEnvironment={env.deleteEnvironment}
                duplicateEnvironment={env.duplicateEnvironment}
            />

            {showSaveModal && (
                <div className={styles.modalOverlay} onClick={() => setShowSaveModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Save Request</h3>
                            <button className={styles.closeBtn} onClick={() => setShowSaveModal(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p className={styles.modalHint}>
                                {activeSaved
                                    ? `Editing “${activeSaved.name}”. Update it, or save a copy.`
                                    : "Give your request a name to save it for later."}
                            </p>
                            <input
                                className={styles.saveNameInput}
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                placeholder="Request name"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") (activeSaved ? handleUpdateSaved : handleSaveRequest)();
                                }}
                            />
                            <label className={styles.fieldLabel} htmlFor="save-folder">Folder</label>
                            <select
                                id="save-folder"
                                className={styles.saveSelect}
                                value={saveFolder}
                                onChange={(e) => setSaveFolder(e.target.value)}
                            >
                                <option value="">(No folder)</option>
                                {collections.folders.map((f) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                                <option value={NEW_FOLDER}>+ New folder…</option>
                            </select>
                            {saveFolder === NEW_FOLDER && (
                                <input
                                    className={styles.saveNameInput}
                                    style={{ marginTop: "0.5rem" }}
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="New folder name"
                                    aria-label="New folder name"
                                />
                            )}
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.button} onClick={() => setShowSaveModal(false)}>
                                Cancel
                            </button>
                            {activeSaved ? (
                                <>
                                    <button
                                        className={styles.button}
                                        onClick={handleSaveRequest}
                                        disabled={!saveName.trim()}
                                    >
                                        Save as new
                                    </button>
                                    <button
                                        className={styles.primaryBtn}
                                        onClick={handleUpdateSaved}
                                        disabled={!saveName.trim()}
                                    >
                                        Update
                                    </button>
                                </>
                            ) : (
                                <button
                                    className={styles.primaryBtn}
                                    onClick={handleSaveRequest}
                                    disabled={!saveName.trim()}
                                >
                                    Save
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showCurlModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCurlModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Import from cURL</h3>
                            <button className={styles.closeBtn} onClick={() => setShowCurlModal(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p className={styles.modalHint}>
                                Paste a cURL command below to populate the request fields.
                            </p>
                            <CodeMirrorEditor
                                value={curlInput}
                                onChange={setCurlInput}
                                language="bash"
                                placeholder="curl https://api.example.com/data -H 'Authorization: Bearer token'"
                                height="150px"
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.button} onClick={() => setShowCurlModal(false)}>
                                Cancel
                            </button>
                            <button
                                className={styles.primaryBtn}
                                onClick={applyCurlImport}
                                disabled={!curlInput.trim()}
                            >
                                Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
