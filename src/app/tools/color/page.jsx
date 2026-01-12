'use client';

import { useState, useMemo } from 'react';
import { Copy, Palette } from 'lucide-react';
import styles from './page.module.css';

export default function ColorTool() {
    const [color, setColor] = useState('#3498db');

    const parsed = useMemo(() => {
        // Parse hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) || 0;
        const g = parseInt(hex.substring(2, 4), 16) || 0;
        const b = parseInt(hex.substring(4, 6), 16) || 0;

        // RGB to HSL
        const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
        const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
                case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
                case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
            }
        }

        return {
            hex: color.toUpperCase(),
            rgb: `rgb(${r}, ${g}, ${b})`,
            hsl: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
            r, g, b,
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
        };
    }, [color]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Color Picker</h1>
            </header>

            <div className={styles.grid}>
                <div className={styles.pickerPanel}>
                    <div
                        className={styles.preview}
                        style={{ backgroundColor: color }}
                    />
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className={styles.colorInput}
                    />
                    <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className={styles.hexInput}
                        placeholder="#000000"
                    />
                </div>

                <div className={styles.infoPanel}>
                    <FormatRow label="HEX" value={parsed.hex} />
                    <FormatRow label="RGB" value={parsed.rgb} />
                    <FormatRow label="HSL" value={parsed.hsl} />

                    <div className={styles.sliders}>
                        <SliderRow label="R" value={parsed.r} max={255} color="#ff0000" />
                        <SliderRow label="G" value={parsed.g} max={255} color="#00ff00" />
                        <SliderRow label="B" value={parsed.b} max={255} color="#0000ff" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormatRow({ label, value }) {
    return (
        <div className={styles.formatRow}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
            <button
                className={styles.copyBtn}
                onClick={() => navigator.clipboard.writeText(value)}
            >
                <Copy size={14} />
            </button>
        </div>
    );
}

function SliderRow({ label, value, max, color }) {
    return (
        <div className={styles.sliderRow}>
            <span className={styles.sliderLabel}>{label}</span>
            <div className={styles.sliderTrack}>
                <div
                    className={styles.sliderFill}
                    style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
                />
            </div>
            <span className={styles.sliderValue}>{value}</span>
        </div>
    );
}
