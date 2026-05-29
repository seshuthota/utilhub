'use client';

import { useState } from "react";
import { Play, Trash2, X, Loader2, Network, Braces } from "lucide-react";
import { useToast } from "@/components/Toast";
import { parseCurl } from "@/utils/curl";
import RequestBuilder, { RequestState, AuthState } from "@/components/common/RequestBuilder";
import ResponseViewer, { ResponseData } from "@/components/common/ResponseViewer";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import styles from "./page.module.css";

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

export default function CurlTester() {
    const [request, setRequest] = useState<RequestState>(EXAMPLE);
    const [response, setResponse] = useState<ResponseData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showCurlModal, setShowCurlModal] = useState(false);
    const [curlInput, setCurlInput] = useState("");
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

            // Add auth header
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
            key: h.key,
            value: h.value,
            active: true,
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
                            <button
                                className={styles.button}
                                onClick={() => setShowCurlModal(false)}
                            >
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
