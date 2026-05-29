'use client';

import { useState } from "react";
import { Clock, Copy } from "lucide-react";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import styles from "./ResponseViewer.module.css";

export interface ResponseData {
    status: number;
    statusText: string;
    time: number;
    headers: Record<string, string>;
    data: any;
}

interface ResponseViewerProps {
    response: ResponseData | null;
    error?: string;
    onCopyBody?: () => void;
}

function statusClass(status: number): string {
    if (status < 300) return styles.statusSuccess;
    if (status < 400) return styles.statusRedirect;
    if (status < 500) return styles.statusClientError;
    return styles.statusServerError;
}

function formatBody(data: any): string {
    if (typeof data === "string") return data;
    return JSON.stringify(data, null, 2);
}

type Tab = "body" | "headers";

export default function ResponseViewer({ response, error, onCopyBody }: ResponseViewerProps) {
    const [activeTab, setActiveTab] = useState<Tab>("body");

    if (error && !response) {
        return <div className={styles.errorBox}><span className={styles.errorLabel}>Error:</span> {error}</div>;
    }

    if (!response) return null;

    const responseHeaders = Object.entries(response.headers || {});
    const bodyText = formatBody(response.data);

    return (
        <div className={styles.container}>
            <div className={styles.meta}>
                <span className={`${styles.statusBadge} ${statusClass(response.status)}`}>
                    {response.status} {response.statusText}
                </span>
                <span className={styles.timeDisplay}>
                    <Clock size={14} />
                    {response.time}ms
                </span>
                {onCopyBody && (
                    <button className={styles.copyBtn} onClick={onCopyBody} title="Copy body">
                        <Copy size={14} /> Copy
                    </button>
                )}
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "body" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("body")}
                >
                    Body
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "headers" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("headers")}
                >
                    Headers {responseHeaders.length > 0 && `(${responseHeaders.length})`}
                </button>
            </div>

            {activeTab === "body" && (
                <div className={styles.bodyContainer}>
                    <CodeMirrorEditor
                        value={bodyText}
                        language="json"
                        readOnly
                        height="350px"
                    />
                </div>
            )}

            {activeTab === "headers" && (
                <div className={styles.headersContainer}>
                    {responseHeaders.length === 0 ? (
                        <div className={styles.empty}>No response headers</div>
                    ) : (
                        responseHeaders.map(([key, value]) => (
                            <div key={key} className={styles.headerRow}>
                                <span className={styles.headerKey}>{key}:</span>
                                <span className={styles.headerValue}>{String(value)}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
