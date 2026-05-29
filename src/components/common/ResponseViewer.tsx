'use client';

import { useState, useMemo } from "react";
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

function detectLanguage(headers: Record<string, string>): string {
    const ct = (headers["content-type"] || headers["Content-Type"] || "").toLowerCase();
    if (ct.includes("json")) return "json";
    if (ct.includes("html")) return "html";
    if (ct.includes("xml") || ct.includes("svg")) return "xml";
    if (ct.includes("yaml")) return "yaml";
    if (ct.includes("css")) return "css";
    if (ct.includes("javascript") || ct.includes("ecmascript")) return "javascript";
    return "json";
}

function isPreviewable(headers: Record<string, string>): { preview: boolean; type: string } {
    const ct = (headers["content-type"] || headers["Content-Type"] || "").toLowerCase();
    if (ct.includes("html")) return { preview: true, type: "html" };
    if (ct.includes("svg")) return { preview: true, type: "svg" };
    if (ct.startsWith("image/")) return { preview: true, type: "image" };
    return { preview: false, type: "none" };
}

type Tab = "body" | "preview" | "headers";

export default function ResponseViewer({ response, error, onCopyBody }: ResponseViewerProps) {
    const [activeTab, setActiveTab] = useState<Tab>("body");

    if (error && !response) {
        return <div className={styles.errorBox}><span className={styles.errorLabel}>Error:</span> {error}</div>;
    }

    if (!response) return null;

    const responseHeaders = Object.entries(response.headers || {});
    const bodyText = formatBody(response.data);
    const lang = detectLanguage(response.headers || {});
    const { preview: canPreview, type: previewType } = isPreviewable(response.headers || {});

    const tabs: Tab[] = ["body", ...(canPreview ? ["preview" as Tab] : []), "headers"];

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
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "body" ? "Body" : tab === "preview" ? "Preview" : `Headers (${responseHeaders.length})`}
                    </button>
                ))}
            </div>

            {activeTab === "body" && (
                <div className={styles.bodyContainer}>
                    <CodeMirrorEditor
                        value={bodyText}
                        language={lang}
                        readOnly
                        height="350px"
                    />
                </div>
            )}

            {activeTab === "preview" && (
                <div className={styles.previewContainer}>
                    {previewType === "html" && (
                        <iframe
                            className={styles.iframe}
                            srcDoc={bodyText}
                            title="Response preview"
                            sandbox="allow-same-origin"
                        />
                    )}
                    {previewType === "svg" && (
                        <div
                            className={styles.svgPreview}
                            dangerouslySetInnerHTML={{ __html: bodyText }}
                        />
                    )}
                    {previewType === "image" && (
                        <img
                            className={styles.imagePreview}
                            src={`data:${response.headers["content-type"] || response.headers["Content-Type"] || "image/png"};base64,${btoa(bodyText)}`}
                            alt="Response preview"
                        />
                    )}
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
