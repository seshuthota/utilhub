'use client';

import { useState, useCallback, useRef } from 'react';
import JSZip from 'jszip'; // Corrected import
import { Image as ImageIcon, Upload, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

const FAVICON_SIZES = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'android-chrome-192x192.png' },
    { size: 512, name: 'android-chrome-512x512.png' },
];

export default function FaviconGenerator() {
    const [sourceImage, setSourceImage] = useState(null); // URL of uploaded image
    const [previews, setPreviews] = useState([]); // Array of { size, url, blob }
    const [isGenerating, setIsGenerating] = useState(false);
    const { showToast } = useToast();
    const canvasRef = useRef(null);

    const processImage = async (file) => {
        setIsGenerating(true);
        const imgUrl = URL.createObjectURL(file);
        setSourceImage(imgUrl);

        try {
            const img = new Image();
            img.src = imgUrl;
            await new Promise((resolve) => { img.onload = resolve; });

            const newPreviews = [];

            for (const config of FAVICON_SIZES) {
                const canvas = document.createElement('canvas'); // Use separate canvas for processing
                canvas.width = config.size;
                canvas.height = config.size;
                const ctx = canvas.getContext('2d');

                // High quality resizing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, config.size, config.size);

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const url = URL.createObjectURL(blob);

                newPreviews.push({ ...config, url, blob });
            }

            setPreviews(newPreviews);
            showToast('Icons generated successfully!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to generate icons', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) processImage(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) processImage(file);
    };

    const downloadZip = async () => {
        if (!previews.length) return;

        const zip = new JSZip();

        // Add PNGs
        previews.forEach(p => {
            zip.file(p.name, p.blob);
        });

        // Generate favicon.ico (Simple wrapper around 32x32 PNG)
        // Note: Real ICO creation is complex, but many browsers accept a PNG renamed or simple wrapper.
        // For simplicity, we'll try to use the 32x32 PNG blob directly as favicon.ico 
        // effectively, though strictly it should have a header.
        // Let's create a minimal valid ICO header if possible.
        // ICO Header: 6 bytes (0,0, 1,0, 1,0) -> Type 1 (Icon), Count 1
        // Entry: 16 bytes (W, H, Colors, Res, Planes, BPP, Size, Offset)
        // PNG Data

        const fav32 = previews.find(p => p.size === 32);
        if (fav32) {
            const pngSize = fav32.blob.size;
            const header = new Uint8Array(6 + 16);
            const view = new DataView(header.buffer);

            // Header
            view.setUint16(0, 0, true); // Reserved
            view.setUint16(2, 1, true); // Type (1=ICON)
            view.setUint16(4, 1, true); // Count (1 image)

            // Entry
            view.setUint8(6, 32); // Width
            view.setUint8(7, 32); // Height
            view.setUint8(8, 0); // Colors (0=256+)
            view.setUint8(9, 0); // Reserved
            view.setUint16(10, 1, true); // Planes
            view.setUint16(12, 32, true); // BPP
            view.setUint32(14, pngSize, true); // Image Size
            view.setUint32(18, 6 + 16, true); // Offset (Header + Entry) -- 22 bytes

            const icoBlob = new Blob([header, fav32.blob], { type: 'image/x-icon' });
            zip.file('favicon.ico', icoBlob);
        }

        // Add site.webmanifest
        const manifest = {
            name: "My App",
            short_name: "App",
            icons: [
                { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
                { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
            ],
            theme_color: "#ffffff",
            background_color: "#ffffff",
            display: "standalone"
        };
        zip.file('site.webmanifest', JSON.stringify(manifest, null, 2));

        // Generate and Download
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'favicons.zip';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ImageIcon size={24} className="text-primary" />
                    <h1 className={styles.title}>Favicon Generator</h1>
                </div>
                <button
                    className={styles.downloadBtn}
                    onClick={downloadZip}
                    disabled={!previews.length}
                >
                    <Download size={18} /> Download All (ZIP)
                </button>
            </header>

            <div className={styles.main} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                <label className={`${styles.dropzone} ${sourceImage ? styles.active : ''}`}>
                    <Upload size={32} className="text-secondary" style={{ marginBottom: '1rem' }} />
                    <span style={{ fontWeight: 500, fontSize: '1.1rem' }}>
                        {sourceImage ? 'Change Image' : 'Click or Drag Image Here'}
                    </span>
                    <span className="text-secondary" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Supports PNG, JPG, SVG
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </label>

                {isGenerating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                        <Loader2 className="animate-spin text-primary" /> Generating icons...
                    </div>
                )}

                {previews.length > 0 && (
                    <div className={styles.previewGrid}>
                        {previews.map((preview) => (
                            <div key={preview.name} className={styles.previewCard}>
                                <img
                                    src={preview.url}
                                    alt={preview.name}
                                    width={preview.size > 64 ? 64 : preview.size}
                                    height={preview.size > 64 ? 64 : preview.size}
                                    className={styles.previewImage}
                                />
                                <span className={styles.sizeLabel}>{preview.size}x{preview.size}</span>
                                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>{preview.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
