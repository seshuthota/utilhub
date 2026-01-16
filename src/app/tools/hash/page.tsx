'use client';

import { useState, useMemo, ChangeEvent } from "react";
import {
    Shield,
    Copy,
    FileText,
    AlertTriangle,
    Clock,
    Loader2,
} from "lucide-react";
import styles from "./page.module.css";

// Assuming hooks are not migrated yet, we treat them as returning any or inferring poorly
// But ideally we should have migrated hooks first. Since we are doing tools now, we accept implicit any from hooks.
import { useInputSize } from "@/hooks/useInputSize";
import { useToast } from "@/components/Toast";

import hashWorkerScript from "@/workers/hash.worker.js?raw";
import { useWorker } from "@/hooks/useWorker";
import CryptoJS from "crypto-js";

interface SizeWarningProps {
    inputSize: {
        status: 'idle' | 'normal' | 'warning' | 'heavy' | 'critical';
        estimatedTime?: string;
        isProcessing?: boolean;
        sizeKB?: string;
        // possibly other props from useInputSize
    }
}

function SizeWarning({ inputSize }: SizeWarningProps) {
    if (inputSize.status === "idle" || inputSize.status === "normal") return null;

    const warningStyles = {
        warning: {
            background: "var(--warning-bg)",
            color: "var(--warning-color)",
            border: "1px solid var(--warning-color)",
        },
        heavy: {
            background: "rgba(255, 165, 0, 0.15)",
            color: "orange",
            border: "1px solid orange",
        },
        critical: {
            background: "var(--error-bg)",
            color: "var(--error-color)",
            border: "1px solid var(--error-color)",
        },
    };

    const style = warningStyles[inputSize.status] || warningStyles.warning;
    const messages = {
        warning: "Large input - using background processing",
        heavy: "Very large input - processing may take several seconds",
        critical: "Input size exceeds recommended limit",
    };

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
            <span>{messages[inputSize.status]}</span>
            {inputSize.estimatedTime && (
                <span
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        marginLeft: "auto",
                    }}
                >
                    <Clock size={14} />
                    Est. time: {inputSize.estimatedTime}
                </span>
            )}
            {inputSize.isProcessing && (
                <span
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        marginLeft: "auto",
                    }}
                >
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                </span>
            )}
        </div>
    );
}

export default function HashTool() {
    const [input, setInput] = useState("Hello World");
    const { showToast } = useToast();

    const inputSize = useInputSize({
        warningThreshold: 1024 * 500, // 500KB
        heavyThreshold: 1024 * 1024 * 2, // 2MB
        criticalThreshold: 1024 * 1024 * 5, // 5MB
        maxSize: 50 * 1024 * 1024, // 50MB hard limit
    });

    const { execute: runHashWorker, isReady: workerReady } = useWorker(
        hashWorkerScript,
        {
            maxConcurrent: 1,
            timeout: 120000,
            onError: (err: any) => {
                console.error("Hash Worker error:", err);
                showToast("Hash generation error", "error");
            },
        },
    );

    const algorithms = ["MD5", "SHA1", "SHA256", "SHA512"];

    const hashes = useMemo(() => {
        if (!input) {
            return algorithms.map((algo) => ({ label: algo, val: "" }));
        }
        // For small inputs, compute synchronously for immediate feedback
        try {

            return algorithms.map((algo) => {
                let val = "";
                switch (algo) {
                    case "MD5":
                        val = CryptoJS.MD5(input).toString();
                        break;
                    case "SHA1":
                        val = CryptoJS.SHA1(input).toString();
                        break;
                    case "SHA256":
                        val = CryptoJS.SHA256(input).toString();
                        break;
                    case "SHA512":
                        val = CryptoJS.SHA512(input).toString();
                        break;
                }
                return { label: algo, val };
            });
        } catch (e) {
            return algorithms.map((algo) => ({ label: algo, val: "Error" }));
        }
    }, [input]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("Copied to clipboard", "success");
    };

    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);
        inputSize.setInput(value);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Hash Generator</h1>
            </header>

            <SizeWarning inputSize={inputSize as any} />

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Input Text</h2>
                    <textarea
                        className={styles.textarea}
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Enter text to hash..."
                    />
                    <div className={styles.info}>
                        <FileText size={14} /> Length: {input.length} chars{" "}
                        {inputSize.sizeKB !== "0.00" && `(${inputSize.sizeKB} KB)`}
                    </div>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Computed Hashes</h2>
                    <div className={styles.hashList}>
                        {hashes.map((h) => (
                            <div key={h.label} className={styles.hashRow}>
                                <div className={styles.hashLabel}>{h.label}</div>
                                <div className={styles.hashValue}>{h.val}</div>
                                <button
                                    onClick={() => copyToClipboard(h.val)}
                                    className={styles.copyBtn}
                                    title="Copy"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
