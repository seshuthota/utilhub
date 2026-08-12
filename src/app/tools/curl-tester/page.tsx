'use client';

import { useState, useRef, useCallback } from "react";
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

    const activeEnv = env.getActiveEnvironment();
    const resolve = useCallback(
        (text: string) =>
            activeEnv ? substituteVariables(text, activeEnv.variables) : text,
        [activeEnv],
    );

    const handleSend = useCallback(async () => {
        const payload = buildProxyPayload(request, resolve, DEFAULT_TIMEOUT_MS);
        if (!payload.url.trim()) {
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
            const res = await fetch("/api/tester/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            const data = await res.json();
            if (controller.signal.aborted) return;

            if (data.error && !data.status) {
                setError(data.error);
                showToast(data.error, "error");
            } else if (data.error && res.status >= 400 && !data.headers) {
                // Proxy-level error (timeout, bad gateway)
                setError(data.error);
                showToast(data.error, "error");
            } else {
                setResponse(data);
                if (data.error) {
                    setError(data.error);
                }
                addToHistory({
                    method: request.method,
                    url: request.url,
                    timestamp: Date.now(),
                    status: data.status,
                    request: stripFilePayloads(JSON.parse(JSON.stringify(request))),
                    response: data,
                });
                if (data.status) {
                    showToast(`${data.status} in ${data.time}ms`, "success");
                }
            }
        } catch (e: unknown) {
            if (e instanceof DOMException && e.name === "AbortError") {
                showToast("Request cancelled", "error");
                setError("Request cancelled");
                return;
            }
            const message = e instanceof Error ? e.message : "Request failed";
            setError(message);
            showToast("Request failed", "error");
        } finally {
            if (abortRef.current === controller) {
                abortRef.current = null;
            }
            setIsLoading(false);
        }
    }, [request, resolve, showToast, addToHistory]);

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
