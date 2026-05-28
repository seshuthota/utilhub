'use client';

import { useState } from "react";
import {
    Play,
    Trash2,
    Copy,
    Clock,
    Network,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { parseCurl } from "@/utils/curl";
import styles from "./page.module.css";

const EXAMPLE_CURL = `curl 'https://jsonplaceholder.typicode.com/posts' \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"foo","body":"bar","userId":1}'`;

function methodBadgeClass(method: string): string {
    switch (method.toUpperCase()) {
        case "GET": return styles.badgeGet;
        case "POST": return styles.badgePost;
        case "PUT": return styles.badgePut;
        case "DELETE": return styles.badgeDelete;
        case "PATCH": return styles.badgePatch;
        default: return styles.badgePost;
    }
}

function statusClass(status: number): string {
    if (status < 300) return styles.statusSuccess;
    if (status < 400) return styles.statusRedirect;
    if (status < 500) return styles.statusClientError;
    return styles.statusServerError;
}

export default function CurlTester() {
    const [input, setInput] = useState(EXAMPLE_CURL);
    const [isLoading, setIsLoading] = useState(false);
    const [parsed, setParsed] = useState<ReturnType<typeof parseCurl> | null>(null);
    const [response, setResponse] = useState<any>(null);
    const { showToast } = useToast();

    const handleParse = () => {
        if (!input.trim()) return;
        const result = parseCurl(input);
        setParsed(result);
        setResponse(null);
        if (result.error) {
            showToast(result.error, "error");
        }
    };

    const handleExecute = async () => {
        if (!parsed || parsed.error || !parsed.url) return;

        setIsLoading(true);
        try {
            const reqHeaders: Record<string, string> = {};
            parsed.headers.forEach((h) => {
                reqHeaders[h.key] = h.value;
            });

            const res = await fetch("/api/tester/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: parsed.url,
                    method: parsed.method,
                    headers: reqHeaders,
                    body: parsed.body || undefined,
                }),
            });

            const data = await res.json();
            setResponse(data);
            if (data.error) {
                showToast(data.error, "error");
            } else {
                showToast(`Response received: ${data.status}`, "success");
            }
        } catch (e: any) {
            showToast(e.message || "Request failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const copyResponse = () => {
        if (!response) return;
        const text = typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data, null, 2);
        navigator.clipboard.writeText(text);
        showToast("Response body copied", "success");
    };

    const loadExample = () => {
        setInput(EXAMPLE_CURL);
        setParsed(null);
        setResponse(null);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <Network size={24} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                    Curl Tester
                </h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={loadExample} title="Load example">
                        <Trash2 size={16} /> Example
                    </button>
                    <button
                        className={styles.button}
                        onClick={() => { setInput(""); setParsed(null); setResponse(null); }}
                        title="Clear"
                    >
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            <div className={styles.inputSection}>
                <textarea
                    className={styles.textarea}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setParsed(null);
                        setResponse(null);
                    }}
                    placeholder="Paste a cURL command here..."
                    spellCheck={false}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                        className={styles.button}
                        onClick={handleParse}
                        disabled={!input.trim()}
                    >
                        Parse
                    </button>
                    <button
                        className={styles.primaryBtn}
                        onClick={handleExecute}
                        disabled={!parsed || !!parsed.error || !parsed.url || isLoading}
                    >
                        {isLoading ? (
                            <><Loader2 size={16} className="animate-spin" /> Sending...</>
                        ) : (
                            <><Play size={16} /> Execute</>
                        )}
                    </button>
                </div>
            </div>

            {parsed && parsed.url && (
                <div className={styles.parsedSection}>
                    <div className={styles.parsedCard}>
                        <div className={styles.parsedLabel}>Method</div>
                        <span className={`${styles.badge} ${methodBadgeClass(parsed.method)}`}>
                            {parsed.method}
                        </span>
                    </div>

                    <div className={styles.parsedCard}>
                        <div className={styles.parsedLabel}>URL</div>
                        <div className={styles.urlDisplay}>{parsed.url}</div>
                    </div>

                    {parsed.headers.length > 0 && (
                        <div className={styles.parsedCard}>
                            <div className={styles.parsedLabel}>
                                Headers ({parsed.headers.length})
                            </div>
                            <div className={styles.headersList}>
                                {parsed.headers.map((h, i) => (
                                    <div key={i} className={styles.headerItem}>
                                        <span className={styles.headerKey}>{h.key}:</span>
                                        <span className={styles.headerValue}>{h.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {parsed.body && (
                        <div className={styles.parsedCard}>
                            <div className={styles.parsedLabel}>Body</div>
                            <pre className={styles.bodyPreview}>{parsed.body}</pre>
                        </div>
                    )}
                </div>
            )}

            {parsed && parsed.error && (
                <div className={styles.error}>
                    <AlertTriangle size={14} /> {parsed.error}
                </div>
            )}

            {response && (
                <div className={styles.responseSection}>
                    <div className={styles.responseMeta}>
                        <span className={`${styles.statusBadge} ${statusClass(response.status)}`}>
                            {response.status} {response.statusText}
                        </span>
                        <span className={styles.timeDisplay}>
                            <Clock size={14} />
                            {response.time}ms
                        </span>
                        <button className={styles.button} onClick={copyResponse}>
                            <Copy size={14} /> Copy Body
                        </button>
                    </div>

                    {response.headers && Object.keys(response.headers).length > 0 && (
                        <details className={styles.responseHeadersSection}>
                            <summary>Response Headers</summary>
                            <div className={styles.headersList}>
                                {Object.entries(response.headers).map(([key, value]: [string, any]) => (
                                    <div key={key} className={styles.headerItem}>
                                        <span className={styles.headerKey}>{key}:</span>
                                        <span className={styles.headerValue}>{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}

                    <div className={styles.responseBody}>
                        {typeof response.data === "string"
                            ? response.data
                            : JSON.stringify(response.data, null, 2)}
                    </div>
                </div>
            )}
        </div>
    );
}
