'use client';

import { useState } from "react";
import { Clock, Copy, Download, HardDrive } from "lucide-react";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import { formatBytes } from "@/utils/apiClientRequest";
import { downloadFile } from "@/utils/download";
import styles from "./ResponseViewer.module.css";

export interface ResponseData {
    status: number;
    statusText: string;
    time: number;
    headers: Record<string, string>;
    data: unknown;
    size?: number;
    contentType?: string;
    encoding?: "text" | "base64";
    /** Headers this client/proxy intentionally set on the upstream request */
    requestHeadersSent?: Record<string, string>;
    transport?: "proxy" | "browser";
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

function formatBody(data: unknown, encoding?: string): string {
    if (encoding === "base64" && typeof data === "string") {
        return `[Binary data — ${formatBytes(Math.floor((data.length * 3) / 4))} base64-encoded]\n\n${data.slice(0, 200)}${data.length > 200 ? "…" : ""}`;
    }
    if (typeof data === "string") return data;
    return JSON.stringify(data, null, 2);
}

function getCopyText(data: unknown, encoding?: string): string {
    if (encoding === "base64" && typeof data === "string") return data;
    if (typeof data === "string") return data;
    return JSON.stringify(data, null, 2);
}

function detectLanguage(headers: Record<string, string>, encoding?: string): string {
    if (encoding === "base64") return "text";
    const ct = (headers["content-type"] || headers["Content-Type"] || "").toLowerCase();
    if (ct.includes("json")) return "json";
    if (ct.includes("html")) return "html";
    if (ct.includes("xml") || ct.includes("svg")) return "xml";
    if (ct.includes("yaml")) return "yaml";
    if (ct.includes("css")) return "css";
    if (ct.includes("javascript") || ct.includes("ecmascript")) return "javascript";
    return "json";
}

function isPreviewable(
    headers: Record<string, string>,
    encoding?: string,
): { preview: boolean; type: string } {
    const ct = (headers["content-type"] || headers["Content-Type"] || "").toLowerCase();
    if (ct.includes("html")) return { preview: true, type: "html" };
    if (ct.includes("svg")) return { preview: true, type: "svg" };
    if (ct.startsWith("image/") || (encoding === "base64" && ct.startsWith("image/"))) {
        return { preview: true, type: "image" };
    }
    return { preview: false, type: "none" };
}

function getContentType(headers: Record<string, string>, fallback?: string): string {
    return headers["content-type"] || headers["Content-Type"] || fallback || "application/octet-stream";
}

function estimateSize(response: ResponseData): number {
    if (typeof response.size === "number") return response.size;
    if (response.encoding === "base64" && typeof response.data === "string") {
        return Math.floor((response.data.length * 3) / 4);
    }
    const text =
        typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data ?? "");
    return new TextEncoder().encode(text).length;
}

function downloadBody(response: ResponseData) {
    const ct = getContentType(response.headers, response.contentType);
    const ext = ct.includes("json")
        ? "json"
        : ct.includes("html")
          ? "html"
          : ct.includes("xml")
            ? "xml"
            : ct.includes("png")
              ? "png"
              : ct.includes("jpeg") || ct.includes("jpg")
                ? "jpg"
                : ct.includes("gif")
                  ? "gif"
                  : ct.includes("webp")
                    ? "webp"
                    : ct.includes("svg")
                      ? "svg"
                      : "txt";

    if (response.encoding === "base64" && typeof response.data === "string") {
        const binary = atob(response.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        downloadFile(new Blob([bytes], { type: ct }), `response.${ext}`, ct);
        return;
    }

    const text =
        typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data, null, 2);
    downloadFile(text, `response.${ext}`, ct.includes("json") ? "application/json" : ct);
}

type Tab = "body" | "preview" | "headers" | "request";

export default function ResponseViewer({ response, error, onCopyBody }: ResponseViewerProps) {
    const [activeTab, setActiveTab] = useState<Tab>("body");

    if (error && !response) {
        return (
            <div className={styles.errorBox}>
                <span className={styles.errorLabel}>Error:</span> {error}
            </div>
        );
    }

    if (!response) {
        return (
            <div className={styles.emptyState}>
                Response will appear here after you send a request.
            </div>
        );
    }

    const responseHeaders = Object.entries(response.headers || {});
    const bodyText = formatBody(response.data, response.encoding);
    const lang = detectLanguage(response.headers || {}, response.encoding);
    const { preview: canPreview, type: previewType } = isPreviewable(
        response.headers || {},
        response.encoding,
    );
    const size = estimateSize(response);
    const contentType = getContentType(response.headers, response.contentType);

    const sentHeaders = Object.entries(response.requestHeadersSent || {});
    const tabs: Tab[] = [
        "body",
        ...(canPreview ? (["preview"] as Tab[]) : []),
        "headers",
        ...(sentHeaders.length > 0 || response.transport ? (["request"] as Tab[]) : []),
    ];

    const handleCopy = () => {
        if (onCopyBody) {
            onCopyBody();
            return;
        }
        navigator.clipboard.writeText(getCopyText(response.data, response.encoding));
    };

    return (
        <div className={styles.container}>
            <div className={styles.meta}>
                <span className={`${styles.statusBadge} ${statusClass(response.status)}`}>
                    {response.status} {response.statusText}
                </span>
                <span className={styles.timeDisplay}>
                    <Clock size={14} aria-hidden />
                    {response.time}ms
                </span>
                <span className={styles.timeDisplay} title="Response size">
                    <HardDrive size={14} aria-hidden />
                    {formatBytes(size)}
                </span>
                <div className={styles.metaActions}>
                    <button
                        className={styles.copyBtn}
                        onClick={handleCopy}
                        title="Copy body"
                        aria-label="Copy response body"
                    >
                        <Copy size={14} aria-hidden /> Copy
                    </button>
                    <button
                        className={styles.copyBtn}
                        onClick={() => downloadBody(response)}
                        title="Download body"
                        aria-label="Download response body"
                    >
                        <Download size={14} aria-hidden /> Download
                    </button>
                </div>
            </div>

            <div className={styles.tabs}>
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "body"
                            ? "Body"
                            : tab === "preview"
                              ? "Preview"
                              : tab === "request"
                                ? `Request sent${response.transport ? ` (${response.transport})` : ""}`
                                : `Headers (${responseHeaders.length})`}
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
                            srcDoc={typeof response.data === "string" ? response.data : bodyText}
                            title="Response preview"
                            sandbox="allow-same-origin"
                        />
                    )}
                    {previewType === "svg" && (
                        <div
                            className={styles.svgPreview}
                            dangerouslySetInnerHTML={{
                                __html:
                                    typeof response.data === "string" ? response.data : bodyText,
                            }}
                        />
                    )}
                    {previewType === "image" && response.encoding === "base64" && typeof response.data === "string" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            className={styles.imagePreview}
                            src={`data:${contentType};base64,${response.data}`}
                            alt="Response preview"
                        />
                    )}
                    {previewType === "image" && response.encoding !== "base64" && (
                        <div className={styles.empty}>Image preview requires binary encoding</div>
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

            {activeTab === "request" && (
                <div className={styles.headersContainer}>
                    <div className={styles.requestHint}>
                        Headers we set on the upstream request
                        {response.transport === "proxy"
                            ? " (via server proxy). Host is added by the HTTP stack. If your API is hosted on Vercel, Vercel’s edge may still inject x-vercel-id when the request arrives — that is not sent by UtilHub."
                            : " (browser direct). Browsers may add a few restricted headers (e.g. Accept) that pages cannot remove."}
                    </div>
                    {sentHeaders.length === 0 ? (
                        <div className={styles.empty}>No custom headers were set</div>
                    ) : (
                        sentHeaders.map(([key, value]) => (
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
