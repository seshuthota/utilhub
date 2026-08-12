'use client';

import { useState, useCallback, useRef } from "react";
import CodeMirrorEditor from "@/components/common/CodeMirrorEditor";
import KeyValueEditor from "@/components/common/KeyValueEditor";
import {
    type AuthState,
    type BodyMode,
    type FormField,
    type RequestState,
    applyBodyModeContentType,
    buildUrl,
    parseParamsFromUrl,
    requestStateFromCurl,
} from "@/utils/apiClientRequest";
import { isCurlCommand } from "@/utils/curl";
import styles from "./RequestBuilder.module.css";

export type { AuthState, BodyMode, FormField, RequestState };

interface RequestBuilderProps {
    value: RequestState;
    onChange: (state: RequestState) => void;
    onImportCurl: () => void;
    /** Called after auto-import from URL paste/change (success or failure). */
    onCurlAutoImport?: (result: { ok: boolean; message?: string }) => void;
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

const BODY_MODES: { value: BodyMode; label: string }[] = [
    { value: "none", label: "None" },
    { value: "json", label: "JSON" },
    { value: "raw", label: "Raw" },
    { value: "urlencoded", label: "x-www-form-urlencoded" },
    { value: "multipart", label: "form-data" },
];

type Tab = "params" | "headers" | "auth" | "body";

function fileToBase64(file: File): Promise<{ base64: string; contentType: string; filename: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || "");
            const base64 = result.includes(",") ? result.split(",")[1] : result;
            resolve({
                base64,
                contentType: file.type || "application/octet-stream",
                filename: file.name,
            });
        };
        reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

export default function RequestBuilder({
    value,
    onChange,
    onImportCurl,
    onCurlAutoImport,
}: RequestBuilderProps) {
    const [activeTab, setActiveTab] = useState<Tab>("params");
    const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const update = (partial: Partial<RequestState>) => {
        onChange({ ...value, ...partial });
    };

    const tryApplyCurl = useCallback(
        (text: string): boolean => {
            if (!isCurlCommand(text)) return false;
            const { request, error } = requestStateFromCurl(text);
            if (error || !request) {
                onCurlAutoImport?.({ ok: false, message: error || "Failed to parse cURL" });
                return true; // treated as curl attempt
            }
            onChange(request);
            onCurlAutoImport?.({ ok: true, message: "cURL imported" });
            return true;
        },
        [onChange, onCurlAutoImport],
    );

    const handleUrlChange = useCallback(
        (url: string) => {
            // Auto-import when the whole field is (or becomes) a cURL command
            if (tryApplyCurl(url)) return;
            const params = parseParamsFromUrl(url);
            onChange({ ...value, url, params });
        },
        [value, onChange, tryApplyCurl],
    );

    const handleUrlPaste = useCallback(
        (e: React.ClipboardEvent<HTMLInputElement>) => {
            const text = e.clipboardData.getData("text");
            if (!isCurlCommand(text)) return;
            e.preventDefault();
            tryApplyCurl(text);
        },
        [tryApplyCurl],
    );

    const handleParamsChange = useCallback(
        (params: RequestState["params"]) => {
            const url = buildUrl(value.url, params);
            onChange({ ...value, params, url });
        },
        [value, onChange],
    );

    const handleBodyModeChange = (bodyMode: BodyMode) => {
        const headers = applyBodyModeContentType(value.headers, bodyMode);
        const next: RequestState = { ...value, bodyMode, headers };

        if (
            (bodyMode === "urlencoded" || bodyMode === "multipart") &&
            (!value.formFields || value.formFields.length === 0)
        ) {
            next.formFields = [{ key: "", value: "", type: "text", active: true }];
        }

        onChange(next);
    };

    const updateFormField = (index: number, partial: Partial<FormField>) => {
        const next = [...value.formFields];
        next[index] = { ...next[index], ...partial };
        update({ formFields: next });
    };

    const addFormField = (type: FormField["type"] = "text") => {
        update({
            formFields: [
                ...value.formFields,
                { key: "", value: "", type, active: true },
            ],
        });
    };

    const removeFormField = (index: number) => {
        update({ formFields: value.formFields.filter((_, i) => i !== index) });
    };

    const handleFilePick = async (index: number, file: File | null) => {
        if (!file) {
            updateFormField(index, {
                contentBase64: undefined,
                filename: undefined,
                contentType: undefined,
                value: "",
            });
            return;
        }
        try {
            const { base64, contentType, filename } = await fileToBase64(file);
            updateFormField(index, {
                type: "file",
                contentBase64: base64,
                contentType,
                filename,
                value: filename,
            });
        } catch {
            // ignore read errors; parent can toast if needed
        }
    };

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
                        aria-label="HTTP method"
                    >
                        {METHODS.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>
                <input
                    className={styles.urlInput}
                    value={value.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    onPaste={handleUrlPaste}
                    placeholder="https://api.example.com/data (or paste a cURL command)"
                    spellCheck={false}
                    aria-label="Request URL"
                    title="Paste a URL or a full cURL command to auto-import"
                />
                <button
                    className={styles.importBtn}
                    onClick={onImportCurl}
                    title="Import from cURL"
                    type="button"
                >
                    curl
                </button>
            </div>

            <div className={styles.tabs}>
                <button
                    type="button"
                    className={`${styles.tab} ${activeTab === "params" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("params")}
                >
                    Params {activeParamsCount > 0 && `(${activeParamsCount})`}
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${activeTab === "headers" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("headers")}
                >
                    Headers {activeHeadersCount > 0 && `(${activeHeadersCount})`}
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${activeTab === "auth" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("auth")}
                >
                    Auth {value.auth.type !== "none" && "✦"}
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${activeTab === "body" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("body")}
                >
                    Body {value.bodyMode !== "none" && "✦"}
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
                            onChange={(e) =>
                                update({
                                    auth: {
                                        ...value.auth,
                                        type: e.target.value as AuthState["type"],
                                    },
                                })
                            }
                            className={styles.authSelect}
                            aria-label="Authentication type"
                        >
                            <option value="none">No Auth</option>
                            <option value="bearer">Bearer Token</option>
                            <option value="basic">Basic Auth</option>
                            <option value="apikey">API Key</option>
                        </select>

                        {value.auth.type === "bearer" && (
                            <div className={styles.authField}>
                                <label className={styles.authLabel}>Token</label>
                                <input
                                    className={styles.authInput}
                                    value={value.auth.bearerToken || ""}
                                    onChange={(e) =>
                                        update({
                                            auth: { ...value.auth, bearerToken: e.target.value },
                                        })
                                    }
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
                                        onChange={(e) =>
                                            update({
                                                auth: {
                                                    ...value.auth,
                                                    basicUsername: e.target.value,
                                                },
                                            })
                                        }
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
                                        onChange={(e) =>
                                            update({
                                                auth: {
                                                    ...value.auth,
                                                    basicPassword: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder="password"
                                    />
                                </div>
                            </>
                        )}

                        {value.auth.type === "apikey" && (
                            <>
                                <div className={styles.authField}>
                                    <label className={styles.authLabel}>Key</label>
                                    <input
                                        className={styles.authInput}
                                        value={value.auth.apiKeyName || ""}
                                        onChange={(e) =>
                                            update({
                                                auth: {
                                                    ...value.auth,
                                                    apiKeyName: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder="X-API-Key"
                                        spellCheck={false}
                                    />
                                </div>
                                <div className={styles.authField}>
                                    <label className={styles.authLabel}>Value</label>
                                    <input
                                        className={styles.authInput}
                                        value={value.auth.apiKeyValue || ""}
                                        onChange={(e) =>
                                            update({
                                                auth: {
                                                    ...value.auth,
                                                    apiKeyValue: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder="your-api-key"
                                        spellCheck={false}
                                    />
                                </div>
                                <div className={styles.authField}>
                                    <label className={styles.authLabel}>Add to</label>
                                    <select
                                        className={styles.authSelect}
                                        value={value.auth.apiKeyLocation || "header"}
                                        onChange={(e) =>
                                            update({
                                                auth: {
                                                    ...value.auth,
                                                    apiKeyLocation: e.target.value as
                                                        | "header"
                                                        | "query",
                                                },
                                            })
                                        }
                                        aria-label="API key location"
                                    >
                                        <option value="header">Header</option>
                                        <option value="query">Query Param</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "body" && (
                <div className={styles.tabContent}>
                    <div className={styles.bodyModeRow} role="group" aria-label="Body type">
                        {BODY_MODES.map((mode) => (
                            <button
                                key={mode.value}
                                type="button"
                                className={`${styles.bodyModeBtn} ${
                                    value.bodyMode === mode.value ? styles.bodyModeActive : ""
                                }`}
                                onClick={() => handleBodyModeChange(mode.value)}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    {value.bodyMode === "none" && (
                        <div className={styles.bodyHint}>This request has no body.</div>
                    )}

                    {(value.bodyMode === "json" || value.bodyMode === "raw") && (
                        <CodeMirrorEditor
                            value={value.body}
                            onChange={(val) => update({ body: val })}
                            language={value.bodyMode === "json" ? "json" : "plaintext"}
                            placeholder={
                                value.bodyMode === "json"
                                    ? '{"key": "value"}'
                                    : "Raw request body..."
                            }
                            height="200px"
                        />
                    )}

                    {(value.bodyMode === "urlencoded" || value.bodyMode === "multipart") && (
                        <div className={styles.formFields}>
                            {value.formFields.map((field, i) => (
                                <div key={i} className={styles.formRow}>
                                    <input
                                        type="checkbox"
                                        checked={field.active ?? true}
                                        onChange={(e) =>
                                            updateFormField(i, { active: e.target.checked })
                                        }
                                        className={styles.formCheckbox}
                                        title="Enabled"
                                        aria-label={`Enable field ${i + 1}`}
                                    />
                                    {value.bodyMode === "multipart" && (
                                        <select
                                            className={styles.formTypeSelect}
                                            value={field.type}
                                            onChange={(e) =>
                                                updateFormField(i, {
                                                    type: e.target.value as FormField["type"],
                                                    contentBase64: undefined,
                                                    filename: undefined,
                                                    value: "",
                                                })
                                            }
                                            aria-label={`Field ${i + 1} type`}
                                        >
                                            <option value="text">Text</option>
                                            <option value="file">File</option>
                                        </select>
                                    )}
                                    <input
                                        className={styles.formInput}
                                        value={field.key}
                                        onChange={(e) =>
                                            updateFormField(i, { key: e.target.value })
                                        }
                                        placeholder="Key"
                                        spellCheck={false}
                                    />
                                    {field.type === "file" ? (
                                        <div className={styles.fileField}>
                                            <button
                                                type="button"
                                                className={styles.fileBtn}
                                                onClick={() =>
                                                    fileInputRefs.current[i]?.click()
                                                }
                                            >
                                                {field.filename || "Choose file…"}
                                            </button>
                                            <input
                                                ref={(el) => {
                                                    fileInputRefs.current[i] = el;
                                                }}
                                                type="file"
                                                className={styles.hiddenFile}
                                                onChange={(e) =>
                                                    handleFilePick(
                                                        i,
                                                        e.target.files?.[0] || null,
                                                    )
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <input
                                            className={styles.formInput}
                                            value={field.value}
                                            onChange={(e) =>
                                                updateFormField(i, { value: e.target.value })
                                            }
                                            placeholder="Value"
                                            spellCheck={false}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        className={styles.formRemove}
                                        onClick={() => removeFormField(i)}
                                        title="Remove"
                                        aria-label={`Remove field ${i + 1}`}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    className={styles.addFormBtn}
                                    onClick={() => addFormField("text")}
                                >
                                    + Add {value.bodyMode === "multipart" ? "text" : "field"}
                                </button>
                                {value.bodyMode === "multipart" && (
                                    <button
                                        type="button"
                                        className={styles.addFormBtn}
                                        onClick={() => addFormField("file")}
                                    >
                                        + Add file
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
