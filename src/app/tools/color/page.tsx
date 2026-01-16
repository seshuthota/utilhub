'use client';

import { useState } from 'react';
import { Copy, RefreshCw, Palette, Pipette } from 'lucide-react';
import { useToast } from '@/components/Toast';
import {
    hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToCmyk, cmykToRgb,
    getContrastColor, getRandomColor, RGB, HSL, CMYK
} from '@/utils/color';
import styles from './page.module.css';

export default function ColorConverter() {
    const [hex, setHex] = useState('#6366f1');
    const [rgb, setRgb] = useState<RGB>({ r: 99, g: 102, b: 241 });
    const [hsl, setHsl] = useState<HSL>({ h: 239, s: 84, l: 67 });
    const [cmyk, setCmyk] = useState<CMYK>({ c: 59, m: 58, y: 0, k: 5 });

    const { showToast } = useToast();

    // Generators
    const generateRandom = () => {
        const newHex = getRandomColor();
        updateFromHex(newHex);
        showToast('Random color generated!', 'success');
    };

    // Update handlers
    const updateFromHex = (newHex: string) => {
        setHex(newHex);

        const newRgb = hexToRgb(newHex);
        if (newRgb) {
            setRgb(newRgb);
            setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
            setCmyk(rgbToCmyk(newRgb.r, newRgb.g, newRgb.b));
        }
    };

    const updateFromRgb = (field: keyof RGB, value: string) => {
        const newRgb = { ...rgb, [field]: Number(value) };
        setRgb(newRgb);

        setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
        setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
        setCmyk(rgbToCmyk(newRgb.r, newRgb.g, newRgb.b));
    };

    const updateFromHsl = (field: keyof HSL, value: string) => {
        const newHsl = { ...hsl, [field]: Number(value) };
        setHsl(newHsl);

        const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
        setRgb(newRgb);
        setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
        setCmyk(rgbToCmyk(newRgb.r, newRgb.g, newRgb.b));
    };

    const updateFromCmyk = (field: keyof CMYK, value: string) => {
        const newCmyk = { ...cmyk, [field]: Number(value) };
        setCmyk(newCmyk);

        const newRgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
        setRgb(newRgb);
        setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
        setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast(`Copied: ${text}`, 'success');
    };

    const contrastColor = getContrastColor(hex);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <Palette size={24} /> Color Converter
                </h1>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={generateRandom}>
                        <RefreshCw size={16} /> Randomize
                    </button>
                </div>
            </header>

            <div className={styles.grid}>
                {/* Inputs Column */}
                <div className={styles.inputColumn}>

                    {/* HEX */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            <span>HEX</span>
                            <button className={styles.copyButton} onClick={() => copyToClipboard(hex)}>
                                <Copy size={14} />
                            </button>
                        </div>
                        <div className={styles.hexInputWrapper}>
                            <span className={styles.hash}>#</span>
                            <input
                                className={styles.input}
                                value={hex.replace('#', '')}
                                onChange={(e) => updateFromHex('#' + e.target.value)}
                                maxLength={6}
                            />
                        </div>
                    </div>

                    {/* RGB */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            <span>RGB</span>
                            <button className={styles.copyButton} onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}>
                                <Copy size={14} />
                            </button>
                        </div>
                        <div className={styles.rgbGrid}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>R</label>
                                <input type="number" className={styles.input} value={rgb.r} onChange={(e) => updateFromRgb('r', e.target.value)} min={0} max={255} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>G</label>
                                <input type="number" className={styles.input} value={rgb.g} onChange={(e) => updateFromRgb('g', e.target.value)} min={0} max={255} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>B</label>
                                <input type="number" className={styles.input} value={rgb.b} onChange={(e) => updateFromRgb('b', e.target.value)} min={0} max={255} />
                            </div>
                        </div>
                    </div>

                    {/* HSL */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            <span>HSL</span>
                            <button className={styles.copyButton} onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}>
                                <Copy size={14} />
                            </button>
                        </div>
                        <div className={styles.hslGrid}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>H</label>
                                <input type="number" className={styles.input} value={hsl.h} onChange={(e) => updateFromHsl('h', e.target.value)} min={0} max={360} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>S%</label>
                                <input type="number" className={styles.input} value={hsl.s} onChange={(e) => updateFromHsl('s', e.target.value)} min={0} max={100} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>L%</label>
                                <input type="number" className={styles.input} value={hsl.l} onChange={(e) => updateFromHsl('l', e.target.value)} min={0} max={100} />
                            </div>
                        </div>
                    </div>

                    {/* CMYK */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            <span>CMYK</span>
                            <button className={styles.copyButton} onClick={() => copyToClipboard(`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`)}>
                                <Copy size={14} />
                            </button>
                        </div>
                        <div className={styles.cmykGrid}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>C%</label>
                                <input type="number" className={styles.input} value={cmyk.c} onChange={(e) => updateFromCmyk('c', e.target.value)} min={0} max={100} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>M%</label>
                                <input type="number" className={styles.input} value={cmyk.m} onChange={(e) => updateFromCmyk('m', e.target.value)} min={0} max={100} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Y%</label>
                                <input type="number" className={styles.input} value={cmyk.y} onChange={(e) => updateFromCmyk('y', e.target.value)} min={0} max={100} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>K%</label>
                                <input type="number" className={styles.input} value={cmyk.k} onChange={(e) => updateFromCmyk('k', e.target.value)} min={0} max={100} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Preview Column */}
                <div className={styles.previewColumn}>
                    <div className={styles.previewBox} style={{ backgroundColor: hex, color: contrastColor }}>
                        <span className={styles.contrastText}>Aa</span>
                        <div className={styles.contrastBadge}>
                            Contrast Safe
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            <Pipette size={16} /> Color Picker
                        </div>
                        <div className={styles.pickerWrapper} style={{ backgroundColor: hex }}>
                            <input
                                type="color"
                                className={styles.colorPicker}
                                value={hex}
                                onChange={(e) => updateFromHex(e.target.value)}
                            />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
                            Click the box to open system picker
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
