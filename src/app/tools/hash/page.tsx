'use client';

import { useState, useCallback, useRef } from "react";
import {
    Shield,
    Copy,
    FileText,
    AlertTriangle,
    Clock,
    Loader2,
    Upload,
    Zap,
    File,
} from "lucide-react";
import styles from "./page.module.css";

import { useToast } from "@/components/Toast";
import { md5, sha1, sha256, sha512, sha3 } from "hash-wasm";

interface HashResult {
    label: string;
    val: string;
    time?: number;
}

interface SizeWarningProps {
    inputSize: number;
    isProcessing: boolean;
}

function SizeWarning({ inputSize, isProcessing }: SizeWarningProps) {
    if (inputSize < 500 * 1024) return null; // < 500KB

    const isHeavy = inputSize > 2 * 1024 * 1024; // > 2MB
    const isCritical = inputSize > 10 * 1024 * 1024; // > 10MB

    const style = isCritical
        ? { background: "var(--error-bg)", color: "var(--error-color)", border: "1px solid var(--error-color)" }
        : isHeavy
            ? { background: "rgba(255, 165, 0, 0.15)", color: "orange", border: "1px solid orange" }
            : { background: "var(--warning-bg)", color: "var(--warning-color)", border: "1px solid var(--warning-color)" };

    const message = isCritical
        ? "Very large input - processing may take several seconds"
        : isHeavy
            ? "Large input - using WebAssembly acceleration"
            : "Using WebAssembly for fast hashing";

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                marginBottom: "1rem",
                ...style,
            }}
        >
            <AlertTriangle size={16} />
            <span>{message}</span>
            {isProcessing && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginLeft: "auto" }}>
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                </span>
            )}
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function HashTool() {
    const [input, setInput] = useState("Hello World");
    const [hashes, setHashes] = useState<HashResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [inputSize, setInputSize] = useState(0);
    const [mode, setMode] = useState<'text' | 'file'>('text');
    const [fileName, setFileName] = useState<string | null>(null);
    const [totalTime, setTotalTime] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const algorithms = [
        { id: "MD5", fn: md5 },
        { id: "SHA1", fn: sha1 },
        { id: "SHA256", fn: sha256 },
        { id: "SHA512", fn: sha512 },
        { id: "SHA3-256", fn: (data: string | Uint8Array) => sha3(data, 256) },
    ];

    const computeHashes = useCallback(async (data: string | Uint8Array) => {
        setIsProcessing(true);
        const startTotal = performance.now();

        try {
            const results: HashResult[] = [];

            for (const algo of algorithms) {
                const start = performance.now();
                const hash = await algo.fn(data);
                const time = performance.now() - start;
                results.push({ label: algo.id, val: hash, time });
            }

            setHashes(results);
            setTotalTime(performance.now() - startTotal);
            showToast("Hashes computed with Wasm", "success");
        } catch (e: any) {
            console.error("Hash error:", e);
            showToast("Hash computation failed", "error");
            setHashes(algorithms.map(a => ({ label: a.id, val: "Error" })));
        } finally {
            setIsProcessing(false);
        }
    }, [showToast]);

    const handleTextChange = (value: string) => {
        setInput(value);
        setInputSize(new Blob([value]).size);
    };

    const handleComputeText = () => {
        if (!input.trim()) {
            showToast("Enter some text first", "error");
            return;
        }
        computeHashes(input);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 100 * 1024 * 1024) {
            showToast("File too large (max 100MB)", "error");
            return;
        }

        setFileName(file.name);
        setInputSize(file.size);
        setMode('file');

        try {
            const buffer = await file.arrayBuffer();
            const data = new Uint8Array(buffer);
            await computeHashes(data);
        } catch (e: any) {
            showToast("Failed to read file", "error");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("Copied to clipboard", "success");
    };

    const copyAllHashes = () => {
        const all = hashes.map(h => `${h.label}: ${h.val}`).join('\n');
        navigator.clipboard.writeText(all);
        showToast("All hashes copied", "success");
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    Hash Generator
                    <span className={styles.wasmBadge}>Wasm</span>
                </h1>
                <div className={styles.actions}>
                    <button
                        className={`${styles.modeBtn} ${mode === 'text' ? styles.modeBtnActive : ''}`}
                        onClick={() => { setMode('text'); setFileName(null); }}
                    >
                        <FileText size={16} /> Text
                    </button>
                    <button
                        className={`${styles.modeBtn} ${mode === 'file' ? styles.modeBtnActive : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <File size={16} /> File
                    </button>
                </div>
            </header>

            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            <SizeWarning inputSize={inputSize} isProcessing={isProcessing} />

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        {mode === 'text' ? 'Input Text' : 'Selected File'}
                    </h2>

                    {mode === 'text' ? (
                        <>
                            <textarea
                                className={styles.textarea}
                                value={input}
                                onChange={(e) => handleTextChange(e.target.value)}
                                placeholder="Enter text to hash..."
                            />
                            <div className={styles.inputFooter}>
                                <div className={styles.info}>
                                    <FileText size={14} />
                                    {input.length} chars ({formatBytes(inputSize)})
                                </div>
                                <button
                                    className={styles.computeBtn}
                                    onClick={handleComputeText}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <><Loader2 size={16} className="animate-spin" /> Computing...</>
                                    ) : (
                                        <><Zap size={16} /> Compute Hashes</>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.fileInfo}>
                            <div className={styles.fileIcon}>
                                <File size={48} />
                            </div>
                            <div className={styles.fileName}>{fileName}</div>
                            <div className={styles.fileSize}>{formatBytes(inputSize)}</div>
                            <button
                                className={styles.button}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={16} /> Choose Another
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Computed Hashes</h2>
                        {hashes.length > 0 && (
                            <button onClick={copyAllHashes} className={styles.copyAllBtn}>
                                <Copy size={14} /> Copy All
                            </button>
                        )}
                    </div>

                    {totalTime !== null && hashes.length > 0 && (
                        <div className={styles.benchmarkBar}>
                            <Zap size={14} />
                            <span>Total: {totalTime.toFixed(2)}ms</span>
                            <span className={styles.benchmarkLabel}>WebAssembly accelerated</span>
                        </div>
                    )}

                    <div className={styles.hashList}>
                        {hashes.length > 0 ? (
                            hashes.map((h) => (
                                <div key={h.label} className={styles.hashRow}>
                                    <div className={styles.hashLabel}>
                                        {h.label}
                                        {h.time !== undefined && (
                                            <span className={styles.hashTime}>{h.time.toFixed(1)}ms</span>
                                        )}
                                    </div>
                                    <div className={styles.hashValue}>{h.val}</div>
                                    <button
                                        onClick={() => copyToClipboard(h.val)}
                                        className={styles.copyBtn}
                                        title="Copy"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <Shield size={48} />
                                <p>Click "Compute Hashes" to generate</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
