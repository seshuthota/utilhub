'use client';

import { useState, useEffect, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
    Copy,
    Share2,
    ChevronDown,
    ExternalLink,
    RefreshCcw,
    ShieldCheck,
    Clock,
    Database,
    Braces,
    Code,
    LucideIcon
} from "lucide-react";
import { detectType, DetectionResult } from "@/utils/detection";
import { useToast } from "@/components/Toast";
import styles from "./ActionToolbar.module.css";

interface Recommendation extends Partial<DetectionResult> {
    toolId: string;
    label: string;
    toolPath: string;
    paramKey: string;
    icon: LucideIcon;
    isDetected?: boolean;
}

interface ActionToolbarProps {
    content: string;
    currentToolId: string;
    onCopy?: () => void;
    className?: string;
    style?: CSSProperties;
}

/**
 * Toolbar providing quick actions like Copy and "Send to..." tool chaining.
 * Automatically suggests tools based on content detection.
 */
export default function ActionToolbar({
    content,
    currentToolId,
    onCopy,
    className = '',
    style = {}
}: ActionToolbarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const router = useRouter();
    const { showToast } = useToast();

    const getIcon = (id: string): LucideIcon => {
        switch (id) {
            case "jwt":
                return ShieldCheck;
            case "timestamp":
                return Clock;
            case "sql":
                return Database;
            case "json":
                return Braces;
            case "xml":
                return Code;
            default:
                return ExternalLink;
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!content) {
                setRecommendations([]);
                return;
            }

            const detected = detectType(content);
            const recs: Recommendation[] = [];

            // If something specific is detected (e.g. JWT) and we aren't in that tool
            if (detected && detected.toolId !== currentToolId) {
                recs.push({
                    ...detected,
                    icon: getIcon(detected.toolId),
                    isDetected: true,
                });
            }

            // Add generic helpful tools
            if (currentToolId !== "base64" && content.length < 50000) {
                recs.push({
                    toolId: "base64",
                    label: "Encode to Base64",
                    toolPath: "/tools/base64",
                    paramKey: "input",
                    icon: RefreshCcw,
                });
            }

            if (
                currentToolId !== "json" &&
                (content.startsWith("{") || content.startsWith("["))
            ) {
                recs.push({
                    toolId: "json",
                    label: "Format as JSON",
                    toolPath: "/tools/json",
                    paramKey: "code",
                    icon: Braces,
                });
            }

            setRecommendations(recs);
        }, 0);
        return () => clearTimeout(timer);
    }, [content, currentToolId]);

    const handleCopy = () => {
        if (onCopy) {
            onCopy();
        } else {
            navigator.clipboard.writeText(content);
            showToast(
                "Copied to clipboard",
                "success",
                content.substring(0, 30) + "...",
            );
        }
    };

    const handleSendTo = (tool: Recommendation) => {
        const url = `${tool.toolPath}?${tool.paramKey}=${encodeURIComponent(content)}`;
        router.push(url);
        setIsOpen(false);
    };

    if (!content) return null;

    return (
        <div className={`${styles.toolbar} ${className}`} style={style}>
            <button className={styles.actionBtn} onClick={handleCopy} title="Copy">
                <Copy size={14} /> Copy
            </button>

            {recommendations.length > 0 && (
                <div className={styles.dropdownWrapper}>
                    <button
                        className={`${styles.actionBtn} ${styles.sendBtn} ${isOpen ? styles.active : ""}`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <Share2 size={14} /> Send to...{" "}
                        <ChevronDown size={14} className={isOpen ? styles.rotate : ""} />
                    </button>

                    {isOpen && (
                        <>
                            <div
                                className={styles.overlay}
                                onClick={() => setIsOpen(false)}
                            />
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownHeader}>Recommended Tools</div>
                                {recommendations.map((tool, idx) => {
                                    const Icon = tool.icon;
                                    return (
                                        <button
                                            key={`${tool.toolId}-${idx}`}
                                            className={styles.dropdownItem}
                                            onClick={() => handleSendTo(tool)}
                                        >
                                            <Icon
                                                size={16}
                                                className={tool.isDetected ? styles.detectedIcon : ""}
                                            />
                                            <div className={styles.itemContent}>
                                                <span className={styles.itemLabel}>{tool.label}</span>
                                                {tool.isDetected && (
                                                    <span className={styles.detectedBadge}>
                                                        Magic Match ✨
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
