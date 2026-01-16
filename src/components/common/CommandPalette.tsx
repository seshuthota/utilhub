'use client';

import { useState, useEffect, useRef, CSSProperties, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Command, LucideIcon } from "lucide-react";
import { tools } from "@/config/tools";
import styles from "./CommandPalette.module.css";
// We import types dynamically or define simple interface for Tool since tools.js is JS
import { DetectionResult } from "@/utils/detection"; // We migrated this earlier

// Define Tool interface locally until tools.js is migrated
interface Tool {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    isClientSideOnly?: boolean;
    hasAiFeatures?: boolean;
    category?: string;
    // ... other props
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    className?: string;
    style?: CSSProperties;
}

/**
 * Global command palette for searching tools and navigation.
 * Also supports smart suggestions based on input content detection.
 */
export default function CommandPalette({ isOpen, onClose, className = '', style = {} }: CommandPaletteProps) {
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const [suggestion, setSuggestion] = useState<DetectionResult | null>(null);

    const filteredTools = (tools as any[]).filter(
        (tool: Tool) =>
            tool.title.toLowerCase().includes(query.toLowerCase()) ||
            tool.description.toLowerCase().includes(query.toLowerCase()),
    );

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery("");
            setSuggestion(null);
            setActiveIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        // Run smart detection on query
        if (query.length > 2) {
            import("@/utils/detection").then(({ detectType }) => {
                const result = detectType(query);
                setSuggestion(result);
                // Reset active index if we have a suggestion vs results
                setActiveIndex(0);
            });
        } else {
            setSuggestion(null);
        }
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (!isOpen) return;

            // Adjust navigation count based on if suggestion exists
            const totalItems = filteredTools.length + (suggestion ? 1 : 0);

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % totalItems);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
            } else if (e.key === "Enter") {
                e.preventDefault();

                // Handle Suggestion Selection (Index 0 if suggestion exists)
                if (suggestion && activeIndex === 0) {
                    navigate(suggestion.toolPath, query, suggestion.paramKey);
                    return;
                }

                // Handle Tool Selection (Shift index by 1 if suggestion exists)
                const toolIndex = suggestion ? activeIndex - 1 : activeIndex;
                if (toolIndex >= 0 && filteredTools[toolIndex]) {
                    navigate(filteredTools[toolIndex].href);
                }
            } else if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, filteredTools, activeIndex, suggestion, query]);

    const navigate = (href: string, inputData: string | null = null, paramKey: string = "input") => {
        if (inputData) {
            // URL encode the input data if provided (for smart suggestions)
            const url = `${href}?${paramKey}=${encodeURIComponent(inputData)}`;
            router.push(url);
        } else {
            router.push(href);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${className}`} style={style} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className={styles.searchBox}>
                    <Search className={styles.searchIcon} size={20} aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        placeholder="Search tools or paste content..."
                        aria-label="Search tools"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActiveIndex(0);
                        }}
                    />
                    <button
                        onClick={onClose}
                        className={styles.closeBtn}
                        aria-label="Close search"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className={styles.results}>
                    {/* Smart Suggestion Section */}
                    {suggestion && (
                        <div
                            className={`${styles.suggestion} ${activeIndex === 0 ? styles.active : ""}`}
                            onClick={() =>
                                navigate(suggestion.toolPath, query, suggestion.paramKey)
                            }
                            onMouseEnter={() => setActiveIndex(0)}
                        >
                            <div className={styles.suggestionHeader}>
                                <span className={styles.sparkles}>✨</span>
                                <span className={styles.suggestionLabel}>Smart Suggestion</span>
                            </div>
                            <div className={styles.suggestionContent}>
                                <span className={styles.suggestionTitle}>
                                    {suggestion.label}
                                </span>
                                <span className={styles.suggestionDesc}>
                                    Open in {suggestion.toolId} tool
                                </span>
                            </div>
                            {activeIndex === 0 && (
                                <Command size={14} className={styles.enterHint} />
                            )}
                        </div>
                    )}

                    {filteredTools.map((tool: Tool, index: number) => {
                        const Icon = tool.icon;
                        // Adjust index if suggestion is present
                        const visualIndex = suggestion ? index + 1 : index;
                        const isActive = visualIndex === activeIndex;

                        return (
                            <div
                                key={tool.id}
                                className={`${styles.option} ${isActive ? styles.active : ""}`}
                                onClick={() => navigate(tool.href)}
                                onMouseEnter={() => setActiveIndex(visualIndex)}
                            >
                                <div className={styles.optionIcon}>
                                    <Icon size={18} />
                                </div>
                                <div className={styles.optionContent}>
                                    <span className={styles.optionTitle}>{tool.title}</span>
                                    <span className={styles.optionDesc}>{tool.description}</span>
                                </div>
                                {isActive && <Command size={14} className={styles.enterHint} />}
                            </div>
                        );
                    })}
                    {filteredTools.length === 0 && !suggestion && (
                        <div className={styles.noResults}>
                            No tools found matching &quot;{query}&quot;
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <span>
                        <kbd className={styles.kbd}>↑</kbd>{" "}
                        <kbd className={styles.kbd}>↓</kbd> to navigate
                    </span>
                    <span>
                        <kbd className={styles.kbd}>↵</kbd> to select
                    </span>
                    <span>
                        <kbd className={styles.kbd}>esc</kbd> to close
                    </span>
                </div>
            </div>
        </div>
    );
}
