'use client';

import { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, Image as ImageIcon } from 'lucide-react';
import styles from './page.module.css';

export default function ImageTool() {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [quality, setQuality] = useState(0.8);
    const [format, setFormat] = useState('image/jpeg');
    const [lockAspectRatio, setLockAspectRatio] = useState(true);
    const [aspectRatio, setAspectRatio] = useState(0);
    const canvasRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                setImage(img);
                setWidth(img.width);
                setHeight(img.height);
                setAspectRatio(img.width / img.height);
                setPreview(url);
            };
            img.src = url;
        }
    };

    const handleWidthChange = (val) => {
        setWidth(val);
        if (lockAspectRatio && aspectRatio) {
            setHeight(Math.round(val / aspectRatio));
        }
    };

    const handleHeightChange = (val) => {
        setHeight(val);
        if (lockAspectRatio && aspectRatio) {
            setWidth(Math.round(val * aspectRatio));
        }
    };

    const processImage = () => {
        if (!image) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);

        // Create download
        const dataUrl = canvas.toDataURL(format, quality);
        const link = document.createElement('a');
        link.download = `resized.${format.split('/')[1]}`;
        link.href = dataUrl;
        link.click();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Image Resizer</h1>
            </header>

            <div className={styles.grid}>
                <div className={styles.controls}>
                    <div className={styles.uploadBox}>
                        <input type="file" accept="image/*" onChange={handleFileChange} id="fileInput" hidden />
                        <label htmlFor="fileInput" className={styles.uploadBtn}>
                            <Upload size={24} />
                            <span>Upload Image</span>
                        </label>
                    </div>

                    {image && (
                        <div className={styles.settings}>
                            <div className={styles.checkboxGroup}>
                                <input
                                    type="checkbox"
                                    id="lockRatio"
                                    checked={lockAspectRatio}
                                    onChange={(e) => setLockAspectRatio(e.target.checked)}
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
                                />
                            </div>
                            <div className={styles.group}>
                                <label>Height (px)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.group}>
                                <label>Quality (0-1)</label>
                                <input type="number" min="0.1" max="1" step="0.1" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className={styles.input} />
                            </div>
                            <div className={styles.group}>
                                <label>Format</label>
                                <select value={format} onChange={(e) => setFormat(e.target.value)} className={styles.select}>
                                    <option value="image/jpeg">JPEG</option>
                                    <option value="image/png">PNG</option>
                                    <option value="image/webp">WEBP</option>
                                </select>
                            </div>
                            <button onClick={processImage} className={styles.processBtn}>
                                <Download size={18} /> Download Processed
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
                        </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
            </div>
        </div>
    );
}
