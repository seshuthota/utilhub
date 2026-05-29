'use client';

import { useState } from "react";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import KeyValueEditor from "@/components/common/KeyValueEditor";
import styles from "./RequestBuilder.module.css";

export interface RequestState {
    method: string;
    url: string;
    headers: { key: string; value: string; active?: boolean }[];
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

type Tab = "headers" | "body";

export default function RequestBuilder({ value, onChange, onImportCurl }: RequestBuilderProps) {
    const [activeTab, setActiveTab] = useState<Tab>("headers");

    const update = (partial: Partial<RequestState>) => {
        onChange({ ...value, ...partial });
    };

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
                    onChange={(e) => update({ url: e.target.value })}
                    placeholder="https://api.example.com/data"
                    spellCheck={false}
                />
                <button className={styles.importBtn} onClick={onImportCurl} title="Import from cURL">
                    curl
                </button>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "headers" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("headers")}
                >
                    Headers {value.headers.length > 0 && `(${value.headers.length})`}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "body" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("body")}
                >
                    Body {value.body && "✦"}
                </button>
            </div>

            {activeTab === "headers" && (
                <div className={styles.tabContent}>
                    <KeyValueEditor
                        items={value.headers}
                        onChange={(items) => update({ headers: items })}
                        keyPlaceholder="Header name"
                        valuePlaceholder="Header value"
                        addLabel="Add header"
                    />
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
