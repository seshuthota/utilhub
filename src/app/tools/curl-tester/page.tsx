'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import {
    Play, Trash2, X, Loader2, Network, Braces, History as HistoryIcon, Code, Save, Square,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useHistory } from "@/hooks/useHistory";
import { useEnvironments, substituteVariables } from "@/hooks/useEnvironments";
import { useHotkeys } from "@/hooks/useHotkeys";
import {
    type RequestState,
    DEFAULT_TIMEOUT_MS,
    buildProxyPayload,
    buildBrowserFetchInit,
    migrateRequestState,
    stripFilePayloads,
    requestStateFromCurl,
} from "@/utils/apiClientRequest";
import { generateSnippets, type SnippetLang } from "@/utils/codeSnippets";
import RequestBuilder from "@/components/common/RequestBuilder";
import ResponseViewer, { ResponseData } from "@/components/common/ResponseViewer";
import HistorySidebar from "@/components/common/HistorySidebar";
import EnvironmentManager from "../api-tester/EnvironmentManager";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import styles from "./page.module.css";

const HISTORY_KEY = "utilhub_curl_tester_history";
const COLLECTIONS_KEY = "utilhub_curl_tester_collections";
const SEND_MODE_KEY = "utilhub_curl_tester_send_mode";
const LOCAL_PROXY_DEFAULT = "http://127.0.0.1:3927/proxy";

type SendMode = "proxy" | "browser" | "local";

function loadSendMode(): SendMode {
    try {
        const v = localStorage.getItem(SEND_MODE_KEY);
        if (v === "proxy" || v === "browser" || v === "local") return v;
    } catch { /* ignore */ }
    return "proxy";
}

function explainTransportError(sendMode: SendMode, message: string, responseText?: string): string {
    const combined = `${message} ${responseText || ""}`.toLowerCase();
    if (sendMode === "browser" && /failed to fetch|networkerror|cors/i.test(message)) {
        return (
            "CORS blocked this browser-direct request. Options: " +
            "(1) Enable CORS on your API for this origin, or " +
            "(2) Use Local proxy — run `npm run proxy:local` then Send via → Local proxy."
        );
    }
    if (/x-vercel-id|vercel-id|header.*(not allowed|forbidden|restricted|not permitted)/i.test(combined)) {
        return (
            "Your API rejected a restricted header (often x-vercel-id). " +
            "The hosted Proxy runs on Vercel, which can surface platform headers on Vercel-hosted APIs. " +
            "Fix: run `npm run proxy:local` and choose Send via → Local proxy " +
            "(requests leave from your machine, not Vercel). " +
            "Or allowlist x-vercel-id on the API if it is deployed on Vercel " +
            "(Vercel injects that header on all inbound traffic to Vercel apps)."
        );
    }
    return message;
}

interface HistoryEntry {
    method: string;
    url: string;
    timestamp: number;
    status?: number;
    request: RequestState;
    response?: ResponseData;
}

interface SavedRequest {
    id: string;
    name: string;
    timestamp: number;
    request: RequestState;
}

function loadSaved(): SavedRequest[] {
    try {
        const val = localStorage.getItem(COLLECTIONS_KEY);
        const items: SavedRequest[] = val ? JSON.parse(val) : [];
        return items.map((item) => ({
            ...item,
            request: migrateRequestState(item.request || {}),
        }));
    } catch {
        return [];
    }
}

function saveSaved(items: SavedRequest[]) {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(items));
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
    const [savedRequests, setSavedRequests] = useState<SavedRequest[]>(() => loadSaved());
    const [showCollections, setShowCollections] = useState(false);
    const [snippetLang, setSnippetLang] = useState<SnippetLang>("curl");
    /**
     * proxy  = hosted Next route (CORS bypass; runs on Vercel in production)
     * browser = direct from your browser (needs CORS on the API)
     * local   = local Node proxy on :3927 (no Vercel hop; run `npm run proxy:local`)
     */
    const [sendMode, setSendMode] = useState<SendMode>("proxy");

    useEffect(() => {
        setSendMode(loadSendMode());
    }, []);

    const activeEnv = env.getActiveEnvironment();
    const resolve = useCallback(
        (text: string) =>
            activeEnv ? substituteVariables(text, activeEnv.variables) : text,
        [activeEnv],
    );

    const handleSendModeChange = (mode: SendMode) => {
        setSendMode(mode);
        try {
            localStorage.setItem(SEND_MODE_KEY, mode);
        } catch { /* ignore */ }
        if (mode === "local") {
            showToast("Start local proxy with: npm run proxy:local", "success");
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
            let data: ResponseData & { error?: string };

            if (sendMode === "browser") {
                const { url, init, headersSent } = buildBrowserFetchInit(request, resolve);
                const start = performance.now();
                const res = await fetch(url, { ...init, signal: controller.signal });
                const end = performance.now();
                if (controller.signal.aborted) return;

                const contentType = res.headers.get("content-type") || "";
                const buf = await res.arrayBuffer();
                const size = buf.byteLength;
                const responseHeaders: Record<string, string> = {};
                res.headers.forEach((value, key) => {
                    responseHeaders[key] = value;
                });

                let encoding: "text" | "base64" = "text";
                let bodyData: unknown;
                const isText =
                    !contentType ||
                    contentType.startsWith("text/") ||
                    contentType.includes("json") ||
                    contentType.includes("xml") ||
                    contentType.includes("javascript") ||
                    contentType.includes("html") ||
                    contentType.includes("css");

                if (isText) {
                    const text = new TextDecoder("utf-8").decode(buf);
                    try {
                        bodyData = JSON.parse(text);
                    } catch {
                        bodyData = text;
                    }
                } else {
                    encoding = "base64";
                    const bytes = new Uint8Array(buf);
                    let binary = "";
                    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                    bodyData = btoa(binary);
                }

                data = {
                    status: res.status,
                    statusText: res.statusText,
                    headers: responseHeaders,
                    data: bodyData,
                    time: Math.round(end - start),
                    size,
                    contentType,
                    encoding,
                    requestHeadersSent: headersSent,
                    transport: "browser",
                };
            } else {
                const payload = buildProxyPayload(request, resolve, DEFAULT_TIMEOUT_MS);
                const proxyUrl =
                    sendMode === "local" ? LOCAL_PROXY_DEFAULT : "/api/tester/proxy";

                let res: Response;
                try {
                    res = await fetch(proxyUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                        signal: controller.signal,
                    });
                } catch (fetchErr) {
                    if (sendMode === "local") {
                        throw new Error(
                            "Could not reach local proxy at http://127.0.0.1:3927. " +
                                "Run: npm run proxy:local",
                        );
                    }
                    throw fetchErr;
                }

                data = await res.json();
                if (controller.signal.aborted) return;

                // Surface API body text for header-restriction detection
                const bodyStr =
                    typeof data.data === "string"
                        ? data.data
                        : data.data
                          ? JSON.stringify(data.data)
                          : data.error || "";

                if (data.error && !data.status) {
                    const msg = explainTransportError(sendMode, data.error, bodyStr);
                    setError(msg);
                    showToast(data.error, "error");
                    return;
                }
                if (data.error && res.status >= 400 && !data.headers) {
                    const msg = explainTransportError(sendMode, data.error, bodyStr);
                    setError(msg);
                    showToast(data.error, "error");
                    return;
                }

                // Even on HTTP 4xx/5xx from upstream, show guidance if body mentions header rules
                if (
                    data.status >= 400 &&
                    /x-vercel-id|header/i.test(bodyStr)
                ) {
                    const hint = explainTransportError(sendMode, bodyStr, bodyStr);
                    if (hint !== bodyStr) {
                        setError(hint);
                    }
                }
            }

            setResponse(data);
            addToHistory({
                method: request.method,
                url: request.url,
                timestamp: Date.now(),
                status: data.status,
                request: stripFilePayloads(JSON.parse(JSON.stringify(request))),
                response: data,
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
            const explained = explainTransportError(sendMode, message);
            setError(explained);
            showToast(explained, "error");
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
        setShowCurlModal(false);
        showToast("cURL parsed successfully", "success");
    };

    const handleCurlAutoImport = useCallback(
        (result: { ok: boolean; message?: string }) => {
            if (result.ok) {
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
        setShowHistory(false);
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

    const handleSaveRequest = () => {
        if (!saveName.trim()) return;
        const newItem: SavedRequest = {
            id: crypto.randomUUID(),
            name: saveName.trim(),
            timestamp: Date.now(),
            request: stripFilePayloads(JSON.parse(JSON.stringify(request))),
        };
        const next = [newItem, ...savedRequests];
        setSavedRequests(next);
        saveSaved(next);
        setShowSaveModal(false);
        setSaveName("");
        showToast("Request saved", "success");
    };

    const deleteSaved = (id: string) => {
        const next = savedRequests.filter((r) => r.id !== id);
        setSavedRequests(next);
        saveSaved(next);
    };

    const openSaveModal = () => {
        setSaveName(request.url.replace(/https?:\/\//, "").split(/[?#]/)[0] || "Untitled");
        setShowSaveModal(true);
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
                    <button
                        className={styles.button}
                        onClick={() => { setShowSnippets(true); setSnippetLang("curl"); }}
                        title="View code snippets"
                    >
                        <Code size={16} /> Code
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
                        <Braces size={16} /> Saved
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
                        {env.activeEnvId ? env.environments.find(e => e.id === env.activeEnvId)?.name || "Env" : "Env"}
                    </button>
                    <button
                        className={styles.button}
                        onClick={() => setRequest(EXAMPLE)}
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
                <div className={styles.sendRow}>
                    <span className={styles.shortcutHint}>Ctrl/⌘ + Enter</span>
                    <label
                        className={styles.sendModeLabel}
                        title="Proxy: hosted server (Vercel in prod). Browser: needs CORS. Local: run npm run proxy:local — no Vercel hop."
                    >
                        <span className={styles.sendModeText}>Send via</span>
                        <select
                            className={styles.sendModeSelect}
                            value={sendMode}
                            onChange={(e) => handleSendModeChange(e.target.value as SendMode)}
                            aria-label="Send mode"
                            disabled={isLoading}
                        >
                            <option value="proxy">Proxy (hosted)</option>
                            <option value="browser">Browser (direct)</option>
                            <option value="local">Local proxy (:3927)</option>
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

            <HistorySidebar
                history={savedRequests}
                isOpen={showCollections}
                onClose={() => setShowCollections(false)}
                onSelect={(item: SavedRequest) => {
                    setRequest(migrateRequestState(item.request || {}));
                    setResponse(null);
                    setError(null);
                    setShowCollections(false);
                }}
                onClear={() => { setSavedRequests([]); localStorage.removeItem(COLLECTIONS_KEY); }}
                onDelete={(i) => deleteSaved(savedRequests[i].id)}
                title="Saved Requests"
                renderItem={(item: SavedRequest) => (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>
                            {item.name}
                        </div>
                        <div style={{
                            fontSize: "0.7rem",
                            color: "var(--text-secondary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}>
                            {item.request.method} {item.request.url}
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                            {formatTime(item.timestamp)}
                        </div>
                    </div>
                )}
            />

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
                                Give your request a name to save it for later.
                            </p>
                            <input
                                className={styles.saveNameInput}
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                placeholder="Request name"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === "Enter") handleSaveRequest(); }}
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.button} onClick={() => setShowSaveModal(false)}>
                                Cancel
                            </button>
                            <button
                                className={styles.primaryBtn}
                                onClick={handleSaveRequest}
                                disabled={!saveName.trim()}
                            >
                                Save
                            </button>
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
