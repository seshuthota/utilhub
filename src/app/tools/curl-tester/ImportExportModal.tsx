'use client';

import { useRef, useState } from "react";
import { Download, Copy, Upload, X } from "lucide-react";
import type { Environment } from "@/hooks/useEnvironments";
import type { CollectionsState } from "@/utils/apiClientStore";
import {
    type ImportResult,
    exportHttpFile,
    exportPostman,
    exportUtilHub,
    importAny,
} from "@/utils/apiClientInterop";
import { downloadFile } from "@/utils/download";
import styles from "./page.module.css";

type ExportFormat = "utilhub" | "postman" | "http";

const FORMATS: { value: ExportFormat; label: string; hint: string }[] = [
    { value: "utilhub", label: "UtilHub JSON", hint: "Full backup — folders, requests and (optionally) environments." },
    { value: "postman", label: "Postman v2.1", hint: "Open in Postman, Insomnia, Bruno, Hoppscotch…" },
    { value: "http", label: ".http file", hint: "Plain text for VS Code REST Client / JetBrains — git-friendly." },
];

interface ImportExportModalProps {
    collections: CollectionsState;
    environments: Environment[];
    onImport: (result: ImportResult) => void;
    onClose: () => void;
}

function summarize(result: ImportResult): string {
    const parts = [
        result.folders.length && `${result.folders.length} folder${result.folders.length === 1 ? "" : "s"}`,
        result.requests.length && `${result.requests.length} request${result.requests.length === 1 ? "" : "s"}`,
        result.environments.length &&
            `${result.environments.length} environment${result.environments.length === 1 ? "" : "s"}`,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "nothing importable";
}

export default function ImportExportModal({ collections, environments, onImport, onClose }: ImportExportModalProps) {
    const [tab, setTab] = useState<"export" | "import">("export");
    const [format, setFormat] = useState<ExportFormat>("utilhub");
    const [includeEnvs, setIncludeEnvs] = useState(false);
    const [copied, setCopied] = useState(false);
    const [importText, setImportText] = useState("");
    const [parsed, setParsed] = useState<ImportResult | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const buildExport = () => {
        if (format === "postman") return { text: exportPostman(collections), name: "utilhub-collection.postman_collection.json", type: "application/json" };
        if (format === "http") return { text: exportHttpFile(collections), name: "utilhub-requests.http", type: "text/plain" };
        return {
            text: exportUtilHub(collections, includeEnvs ? environments : null),
            name: "utilhub-api-client.json",
            type: "application/json",
        };
    };

    const parse = (text: string) => {
        setImportText(text);
        if (!text.trim()) {
            setParsed(null);
            setParseError(null);
            return;
        }
        try {
            setParsed(importAny(text));
            setParseError(null);
        } catch (e) {
            setParsed(null);
            setParseError(e instanceof Error ? e.message : "Could not read file");
        }
    };

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        parse(await file.text());
    };

    const nothingToExport = collections.requests.length === 0 && !(format === "utilhub" && includeEnvs && environments.length);

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
                <div className={styles.modalHeader}>
                    <h3>Import / Export</h3>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.segmented} role="tablist">
                        <button role="tab" aria-selected={tab === "export"}
                            className={tab === "export" ? styles.segmentActive : styles.segment}
                            onClick={() => setTab("export")}>
                            Export
                        </button>
                        <button role="tab" aria-selected={tab === "import"}
                            className={tab === "import" ? styles.segmentActive : styles.segment}
                            onClick={() => setTab("import")}>
                            Import
                        </button>
                    </div>

                    {tab === "export" ? (
                        <>
                            <div className={styles.optionList}>
                                {FORMATS.map((f) => (
                                    <label key={f.value} className={styles.option}>
                                        <input type="radio" name="export-format" value={f.value}
                                            checked={format === f.value} onChange={() => setFormat(f.value)} />
                                        <span>
                                            <strong>{f.label}</strong>
                                            <small>{f.hint}</small>
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {format === "utilhub" && (
                                <label className={styles.checkboxRow}>
                                    <input type="checkbox" checked={includeEnvs} onChange={(e) => setIncludeEnvs(e.target.checked)} />
                                    Include environments ({environments.length}) — variable values are exported in plain text
                                </label>
                            )}
                            <p className={styles.modalHint}>
                                {collections.requests.length} saved request{collections.requests.length === 1 ? "" : "s"} in{" "}
                                {collections.folders.length} folder{collections.folders.length === 1 ? "" : "s"}.
                                {" "}<code>{"{{variables}}"}</code> are kept as placeholders; literal tokens in headers or auth are exported as-is.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className={styles.modalHint}>
                                Accepts a UtilHub export, a Postman collection (v2.0 / v2.1) or a Postman environment.
                                Imported items are added alongside what you already have.
                            </p>
                            <div className={styles.importRow}>
                                <button className={styles.button} onClick={() => fileRef.current?.click()}>
                                    <Upload size={16} /> Choose file…
                                </button>
                                <input ref={fileRef} type="file" accept=".json,application/json" hidden
                                    aria-label="Import file"
                                    onChange={(e) => handleFile(e.target.files?.[0])} />
                                <span className={styles.modalHint} style={{ margin: 0 }}>or paste JSON below</span>
                            </div>
                            <textarea
                                className={styles.importTextarea}
                                value={importText}
                                onChange={(e) => parse(e.target.value)}
                                placeholder='{"info": {"name": "My API", "schema": "…collection/v2.1.0…"}, "item": […]}'
                                aria-label="Import JSON"
                                spellCheck={false}
                            />
                            {parseError && <div className={styles.importError}>{parseError}</div>}
                            {parsed && (
                                <div className={styles.importSummary}>
                                    Ready to import <strong>{summarize(parsed)}</strong>.
                                    {parsed.warnings.length > 0 && (
                                        <ul>
                                            {parsed.warnings.map((w) => <li key={w}>{w}</li>)}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className={styles.modalActions}>
                    {tab === "export" ? (
                        <>
                            <button className={styles.button} disabled={nothingToExport}
                                onClick={async () => {
                                    await navigator.clipboard.writeText(buildExport().text);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 1500);
                                }}>
                                <Copy size={16} /> {copied ? "Copied" : "Copy"}
                            </button>
                            <button className={styles.primaryBtn} disabled={nothingToExport}
                                onClick={() => {
                                    const { text, name, type } = buildExport();
                                    downloadFile(text, name, type);
                                }}>
                                <Download size={16} /> Download
                            </button>
                        </>
                    ) : (
                        <>
                            <button className={styles.button} onClick={onClose}>Cancel</button>
                            <button className={styles.primaryBtn}
                                disabled={!parsed || summarize(parsed) === "nothing importable"}
                                onClick={() => parsed && onImport(parsed)}>
                                Import
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
