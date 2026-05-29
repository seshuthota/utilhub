'use client';

import { useState } from "react";
import {
    Play, Trash2, X, Loader2, Network, Braces, History as HistoryIcon,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useHistory } from "@/hooks/useHistory";
import { parseCurl } from "@/utils/curl";
import RequestBuilder, { RequestState, AuthState } from "@/components/common/RequestBuilder";
import ResponseViewer, { ResponseData } from "@/components/common/ResponseViewer";
import HistorySidebar from "@/components/common/HistorySidebar";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import styles from "./page.module.css";

const HISTORY_KEY = "utilhub_curl_tester_history";

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
    body: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}',
};

const EMPTY: RequestState = {
    method: "GET",
    url: "",
    params: [],
    headers: [],
    auth: { type: "none" },
    body: "",
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
    const { showToast } = useToast();

    const handleSend = async () => {
        if (!request.url.trim()) {
            showToast("Enter a URL first", "error");
            return;
        }

        setIsLoading(true);
        setResponse(null);
        setError(null);

        try {
            const reqHeaders: Record<string, string> = {};
            request.headers.forEach((h) => {
                if (h.active !== false && h.key) {
                    reqHeaders[h.key] = h.value;
                }
            });

            if (request.auth.type === "bearer" && request.auth.bearerToken) {
                reqHeaders["Authorization"] = `Bearer ${request.auth.bearerToken}`;
            } else if (request.auth.type === "basic" && request.auth.basicUsername) {
                const encoded = btoa(`${request.auth.basicUsername}:${request.auth.basicPassword || ""}`);
                reqHeaders["Authorization"] = `Basic ${encoded}`;
            }

            const res = await fetch("/api/tester/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: request.url,
                    method: request.method,
                    headers: reqHeaders,
                    body: request.body || undefined,
                }),
            });

            const data = await res.json();
            if (data.error) {
                setError(data.error);
                showToast(data.error, "error");
            } else {
                setResponse(data);
                addToHistory({
                    method: request.method,
                    url: request.url,
                    timestamp: Date.now(),
                    status: data.status,
                    request: JSON.parse(JSON.stringify(request)),
                    response: data,
                });
                showToast(`${data.status} in ${data.time}ms`, "success");
            }
        } catch (e: any) {
            setError(e.message || "Request failed");
            showToast("Request failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportCurl = () => {
        setShowCurlModal(true);
        setCurlInput("");
    };

    const applyCurlImport = () => {
        const parsed = parseCurl(curlInput);
        if (parsed.error) {
            showToast(parsed.error, "error");
            return;
        }
        const headers = parsed.headers.map((h: any) => ({
            key: h.key, value: h.value, active: true,
        }));
        let auth: AuthState = { type: "none" };
        if (parsed.auth?.type === "bearer") {
            auth = { type: "bearer", bearerToken: parsed.auth.token };
        } else if (parsed.auth?.type === "basic") {
            auth = { type: "basic", basicUsername: parsed.auth.username, basicPassword: parsed.auth.password };
        }
        setRequest({
            method: parsed.method || "GET",
            url: parsed.url || "",
            params: [],
            headers,
            auth,
            body: parsed.body || "",
        });
        setShowCurlModal(false);
        showToast("cURL parsed successfully", "success");
    };

    const clearAll = () => {
        setRequest(EMPTY);
        setResponse(null);
        setError(null);
    };

    const copyResponseBody = () => {
        if (!response) return;
        const text = typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data, null, 2);
        navigator.clipboard.writeText(text);
        showToast("Response body copied", "success");
    };

    const loadFromHistory = (entry: HistoryEntry) => {
        setRequest(entry.request);
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
                        onClick={() => setShowHistory(true)}
                        title="History"
                    >
                        <HistoryIcon size={16} /> History
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
                />
                <div className={styles.sendRow}>
                    <button
                        className={styles.primaryBtn}
                        onClick={handleSend}
                        disabled={!request.url.trim() || isLoading}
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

            {showCurlModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCurlModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Import from cURL</h3>
                            <button className={styles.closeBtn} onClick={() => setShowCurlModal(false)}>
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
