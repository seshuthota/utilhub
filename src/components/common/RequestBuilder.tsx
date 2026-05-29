'use client';

import { useState, useCallback } from "react";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import KeyValueEditor from "@/components/common/KeyValueEditor";
import styles from "./RequestBuilder.module.css";

export interface AuthState {
    type: "none" | "bearer" | "basic";
    bearerToken?: string;
    basicUsername?: string;
    basicPassword?: string;
}

export interface RequestState {
    method: string;
    url: string;
    params: { key: string; value: string; active?: boolean }[];
    headers: { key: string; value: string; active?: boolean }[];
    auth: AuthState;
    body: string;
}

interface RequestBuilderProps {
    value: RequestState;
    onChange: (state: RequestState) => void;
    onImportCurl: () => void;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const METHOD_COLORS: Record<string, string> = {
    GET: "#22c55e",
    POST: "#3b82f6",
    PUT: "#f59e0b",
    PATCH: "#a855f7",
    DELETE: "#ef4444",
    HEAD: "#64748b",
    OPTIONS: "#64748b",
};

type Tab = "params" | "headers" | "auth" | "body";

function parseParamsFromUrl(url: string): { key: string; value: string; active?: boolean }[] {
    try {
        const qIndex = url.indexOf("?");
        if (qIndex === -1) return [];
        const qs = url.slice(qIndex + 1);
        const params = new URLSearchParams(qs);
        return Array.from(params.entries()).map(([key, value]) => ({ key, value, active: true }));
    } catch {
        return [];
    }
}

function buildUrl(baseUrl: string, params: { key: string; value: string; active?: boolean }[]): string {
    const qIndex = baseUrl.indexOf("?");
    const base = qIndex === -1 ? baseUrl : baseUrl.slice(0, qIndex);
    const active = params.filter((p) => p.key && p.active !== false);
    if (active.length === 0) return base;
    const qs = active.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&");
    return `${base}?${qs}`;
}

export default function RequestBuilder({ value, onChange, onImportCurl }: RequestBuilderProps) {
    const [activeTab, setActiveTab] = useState<Tab>("params");
    const [lastParamsSource, setLastParamsSource] = useState<"url" | "editor">("url");

    const update = (partial: Partial<RequestState>) => {
        onChange({ ...value, ...partial });
    };

    const handleUrlChange = useCallback((url: string) => {
        setLastParamsSource("url");
        const params = parseParamsFromUrl(url);
        onChange({ ...value, url, params });
    }, [value, onChange]);

    const handleParamsChange = useCallback((params: { key: string; value: string; active?: boolean }[]) => {
        setLastParamsSource("editor");
        const url = buildUrl(value.url, params);
        onChange({ ...value, params, url });
    }, [value, onChange]);

    const activeParamsCount = value.params.filter((p) => p.key).length;
    const activeHeadersCount = value.headers.filter((h) => h.key).length;

    return (
        <div className={styles.container}>
            <div className={styles.urlRow}>
                <div className={styles.methodWrapper}>
                    <select
                        value={value.method}
                        onChange={(e) => update({ method: e.target.value })}
                        className={styles.methodSelect}
                        style={{ color: METHOD_COLORS[value.method] || "#fff" }}
                    >
                        {METHODS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                <input
                    className={styles.urlInput}
                    value={value.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://api.example.com/data"
                    spellCheck={false}
                />
                <button className={styles.importBtn} onClick={onImportCurl} title="Import from cURL">
                    curl
                </button>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "params" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("params")}
                >
                    Params {activeParamsCount > 0 && `(${activeParamsCount})`}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "headers" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("headers")}
                >
                    Headers {activeHeadersCount > 0 && `(${activeHeadersCount})`}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "auth" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("auth")}
                >
                    Auth {value.auth.type !== "none" && "✦"}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "body" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("body")}
                >
                    Body {value.body && "✦"}
                </button>
            </div>

            {activeTab === "params" && (
                <div className={styles.tabContent}>
                    <KeyValueEditor
                        items={value.params}
                        onChange={handleParamsChange}
                        keyPlaceholder="Parameter name"
                        valuePlaceholder="Parameter value"
                        addLabel="Add param"
                        showEnable
                    />
                </div>
            )}

            {activeTab === "headers" && (
                <div className={styles.tabContent}>
                    <KeyValueEditor
                        items={value.headers}
                        onChange={(items) => update({ headers: items })}
                        keyPlaceholder="Header name"
                        valuePlaceholder="Header value"
                        addLabel="Add header"
                        showEnable
                    />
                </div>
            )}

            {activeTab === "auth" && (
                <div className={styles.tabContent}>
                    <div className={styles.authForm}>
                        <select
                            value={value.auth.type}
                            onChange={(e) => update({ auth: { ...value.auth, type: e.target.value as AuthState["type"] } })}
                            className={styles.authSelect}
                        >
                            <option value="none">No Auth</option>
                            <option value="bearer">Bearer Token</option>
                            <option value="basic">Basic Auth</option>
                        </select>

                        {value.auth.type === "bearer" && (
                            <div className={styles.authField}>
                                <label className={styles.authLabel}>Token</label>
                                <input
                                    className={styles.authInput}
                                    value={value.auth.bearerToken || ""}
                                    onChange={(e) => update({ auth: { ...value.auth, bearerToken: e.target.value } })}
                                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                                    spellCheck={false}
                                />
                            </div>
                        )}

                        {value.auth.type === "basic" && (
                            <>
                                <div className={styles.authField}>
                                    <label className={styles.authLabel}>Username</label>
                                    <input
                                        className={styles.authInput}
                                        value={value.auth.basicUsername || ""}
                                        onChange={(e) => update({ auth: { ...value.auth, basicUsername: e.target.value } })}
                                        placeholder="username"
                                        spellCheck={false}
                                    />
                                </div>
                                <div className={styles.authField}>
                                    <label className={styles.authLabel}>Password</label>
                                    <input
                                        className={styles.authInput}
                                        type="password"
                                        value={value.auth.basicPassword || ""}
                                        onChange={(e) => update({ auth: { ...value.auth, basicPassword: e.target.value } })}
                                        placeholder="password"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "body" && (
                <div className={styles.tabContent}>
                    <CodeMirrorEditor
                        value={value.body}
                        onChange={(val) => update({ body: val })}
                        language="json"
                        placeholder='{"key": "value"}'
                        height="200px"
                    />
                </div>
            )}
        </div>
    );
}
