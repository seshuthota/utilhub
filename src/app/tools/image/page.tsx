"use client";

import { useState, useRef, useCallback } from "react";
import {
    Upload,
    Download,
    RefreshCw,
    Image as ImageIcon,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatBytes } from "@/hooks/useInputSize";
import styles from "./page.module.css";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const HEAVY_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface SizeWarningProps {
    fileSize: number;
    processing: boolean;
}

function SizeWarning({ fileSize, processing }: SizeWarningProps) {
    if (!fileSize) return null;

    const isHeavy = fileSize > HEAVY_FILE_SIZE;
    const isOverLimit = fileSize > MAX_FILE_SIZE;

    if (isOverLimit) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    background: "var(--error-bg)",
                    color: "var(--error-color)",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                    border: "1px solid var(--error-color)",
                }}
            >
                <AlertTriangle size={16} />
                <span>
                    File too large ({formatBytes(fileSize)}). Maximum size is{" "}
                    {formatBytes(MAX_FILE_SIZE)}.
                </span>
            </div>
        );
    }

    if (isHeavy) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    background: "rgba(255, 165, 0, 0.15)",
                    color: "orange",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                    border: "1px solid orange",
                }}
            >
                <AlertTriangle size={16} />
                <span>
                    Large file ({formatBytes(fileSize)}). Processing may take a few
                    seconds.
                </span>
                {processing && (
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

    return null;
}

export default function ImageTool() {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState(0);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [quality, setQuality] = useState(0.8);
    const [format, setFormat] = useState("image/jpeg");
    const [lockAspectRatio, setLockAspectRatio] = useState(true);
    const [aspectRatio, setAspectRatio] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { showToast } = useToast();

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (file.size > MAX_FILE_SIZE) {
                showToast("File too large. Maximum size is 20MB.", "error");
                return;
            }

            setFileSize(file.size);

            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                setImage(img);
                setWidth(img.width);
                setHeight(img.height);
                setAspectRatio(img.width / img.height);
                setPreview(url);
                showToast("Image loaded successfully", "success");
            };
            img.onerror = () => {
                showToast("Failed to load image", "error");
                setFileSize(0);
            };
            img.src = url;
        },
        [showToast],
    );

    const handleWidthChange = useCallback(
        (val: number) => {
            setWidth(val);
            if (lockAspectRatio && aspectRatio) {
                setHeight(Math.round(val / aspectRatio));
            }
        },
        [lockAspectRatio, aspectRatio],
    );

    const handleHeightChange = useCallback(
        (val: number) => {
            setHeight(val);
            if (lockAspectRatio && aspectRatio) {
                setWidth(Math.round(val * aspectRatio));
            }
        },
        [lockAspectRatio, aspectRatio],
    );

    const processImage = useCallback(() => {
        if (!image) return;

        setIsProcessing(true);

        setTimeout(() => {
            try {
                const canvas = canvasRef.current;
                if (!canvas) {
                    setIsProcessing(false);
                    return;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");

                if (ctx) {
                    ctx.drawImage(image, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL(format, quality);
                    const link = document.createElement("a");
                    link.download = `resized.${format.split("/")[1]}`;
                    link.href = dataUrl;
                    link.click();
                    showToast("Image processed and downloaded!", "success");
                }
            } catch (error) {
                console.error("Image processing error:", error);
                showToast("Failed to process image", "error");
            } finally {
                setIsProcessing(false);
            }
        }, 100);
    }, [image, width, height, format, quality, showToast]);

    const resetImage = useCallback(() => {
        setImage(null);
        setPreview(null);
        setFileSize(0);
        setWidth(0);
        setHeight(0);
        setAspectRatio(0);
    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Image Resizer</h1>
                {image && (
                    <button
                        onClick={resetImage}
                        className={styles.button}
                        style={{ marginLeft: "auto" }}
                    >
                        <RefreshCw size={16} /> Reset
                    </button>
                )}
            </header>

            <SizeWarning fileSize={fileSize} processing={isProcessing} />

            <div className={styles.grid}>
                <div className={styles.controls}>
                    <div className={styles.uploadBox}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            id="fileInput"
                            hidden
                            disabled={isProcessing}
                        />
                        <label htmlFor="fileInput" className={styles.uploadBtn}>
                            <Upload size={24} />
                            <span>Upload Image</span>
                        </label>
                        {fileSize > 0 && (
                            <span
                                style={{
                                    marginTop: "0.5rem",
                                    fontSize: "0.85rem",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                {formatBytes(fileSize)}
                            </span>
                        )}
                    </div>

                    {image && (
                        <div className={styles.settings}>
                            <div className={styles.checkboxGroup}>
                                <input
                                    type="checkbox"
                                    id="lockRatio"
                                    checked={lockAspectRatio}
                                    onChange={(e) => setLockAspectRatio(e.target.checked)}
                                    disabled={isProcessing}
                                />
                                <label htmlFor="lockRatio">Lock Aspect Ratio</label>
                            </div>
                            <div className={styles.group}>
                                <label>Width (px)</label>
                                <input
                                    type="number"
                                    value={width}
                                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                                    className={styles.input}
                                    disabled={isProcessing}
                                />
                            </div>
                            <div className={styles.group}>
                                <label>Height (px)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                                    className={styles.input}
                                    disabled={isProcessing}
                                />
                            </div>
                            <div className={styles.group}>
                                <label>Quality (0-1)</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                    className={styles.input}
                                    disabled={isProcessing}
                                />
                            </div>
                            <div className={styles.group}>
                                <label>Format</label>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                    className={styles.select}
                                    disabled={isProcessing}
                                >
                                    <option value="image/jpeg">JPEG</option>
                                    <option value="image/png">PNG</option>
                                    <option value="image/webp">WEBP</option>
                                </select>
                            </div>
                            <button
                                onClick={processImage}
                                className={styles.processBtn}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} /> Download Processed
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.previewArea}>
                    {preview ? (
                        <img src={preview} alt="Preview" className={styles.previewImg} />
                    ) : (
                        <div className={styles.placeholder}>
                            <ImageIcon size={48} color="var(--text-secondary)" />
                            <p>No image selected</p>
                            <p
                                style={{
                                    fontSize: "0.85rem",
                                    color: "var(--text-secondary)",
                                    marginTop: "0.5rem",
                                }}
                            >
                                Supports JPG, PNG, WebP up to 20MB
                            </p>
                        </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>
            </div>
        </div>
    );
}
