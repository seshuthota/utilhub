'use client';

import { useEffect, useState, CSSProperties } from "react";
import { X, Keyboard } from "lucide-react";
import styles from "./ShortcutsHelpModal.module.css";

interface ShortcutItem {
    action: string;
    keys: string[];
}

const SHORTCUTS: Record<string, ShortcutItem[]> = {
    Global: [
        { action: "Command Palette", keys: ["Cmd", "K"] },
        { action: "Keyboard Shortcuts", keys: ["Shift", "?"] },
    ],
    "SQL Playground": [
        { action: "Run Query", keys: ["Cmd", "Enter"] },
        { action: "Format SQL", keys: ["Cmd", "Shift", "F"] },
        { action: "Copy Result", keys: ["Cmd", "Shift", "C"] },
    ],
    "Regex Studio": [
        { action: "Match/Replace Mode", keys: ["Cmd", "Enter"] },
        { action: "Copy Result", keys: ["Cmd", "Shift", "C"] },
    ],
    "JSON / XML": [
        { action: "Format Code", keys: ["Cmd", "Enter"] },
        { action: "Minify", keys: ["Cmd", "Shift", "M"] },
        { action: "Copy output", keys: ["Cmd", "Shift", "C"] },
    ],
    "API Tester": [{ action: "Send Request", keys: ["Cmd", "Enter"] }],
};

interface ShortcutsHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    className?: string;
    style?: CSSProperties;
}

/**
 * Modal displaying keyboard shortcuts for the application.
 * Adapts keys (Cmd/Ctrl) based on the user's platform (Mac/Windows).
 */
export default function ShortcutsHelpModal({ isOpen, onClose, className = '', style = {} }: ShortcutsHelpModalProps) {
    const [isMac, setIsMac] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleEscape);
        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    const formatKey = (key: string) => {
        if (key === "Cmd") return isMac ? "⌘" : "Ctrl";
        if (key === "Enter") return "↵";
        if (key === "Shift") return "⇧";
        if (key === "Alt") return isMac ? "⌥" : "Alt";
        return key;
    };

    if (!isOpen) return null;

    return (
        <div
            className={`${styles.overlay} ${className}`}
            style={style}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
        >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.title} id="shortcuts-title">
                        <Keyboard size={24} aria-hidden="true" />
                        Keyboard Shortcuts
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close shortcuts"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className={styles.content}>
                    {Object.entries(SHORTCUTS).map(([category, items]) => (
                        <div key={category} className={styles.category}>
                            <div className={styles.categoryTitle}>{category}</div>
                            <div className={styles.shortcutList}>
                                {items.map((item, idx) => (
                                    <div key={idx} className={styles.shortcutItem}>
                                        <span className={styles.action}>{item.action}</span>
                                        <div className={styles.keys}>
                                            {item.keys.map((k, i) => (
                                                <kbd key={i} className={styles.key}>
                                                    {formatKey(k)}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
