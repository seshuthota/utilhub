'use client';

import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { useUrlState } from '@/hooks/useUrlState';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

export default function NumberBaseTool() {
    // We store the decimal value as the source of truth
    const [value, setValue] = useUrlState('value', '');
    const { showToast } = useToast();

    // Local state for inputs to allow typing invalid characters temporarily
    const [binary, setBinary] = useState('');
    const [octal, setOctal] = useState('');
    const [decimal, setDecimal] = useState('');
    const [hex, setHex] = useState('');

    // Update all inputs when source value changes
    useEffect(() => {
        if (!value) {
            setBinary('');
            setOctal('');
            setDecimal('');
            setHex('');
            return;
        }

        try {
            const dec = BigInt(value);
            setDecimal(dec.toString(10));
            setBinary(dec.toString(2));
            setOctal(dec.toString(8));
            setHex(dec.toString(16).toUpperCase());
        } catch (e) {
            // Invalid value in URL, ignore
        }
    }, [value]);

    const handleChange = (val, base) => {
        // Allow empty
        if (!val.trim()) {
            setValue('');
            setBinary('');
            setOctal('');
            setDecimal('');
            setHex('');
            return;
        }

        // Clean input based on base
        let cleanVal = val.trim();
        if (base === 16) cleanVal = cleanVal.replace(/[^0-9a-fA-F]/g, '');
        else if (base === 8) cleanVal = cleanVal.replace(/[^0-7]/g, '');
        else if (base === 2) cleanVal = cleanVal.replace(/[^0-1]/g, '');
        else cleanVal = cleanVal.replace(/[^0-9]/g, '');

        // Update local state immediately for responsiveness
        if (base === 2) setBinary(cleanVal);
        if (base === 8) setOctal(cleanVal);
        if (base === 10) setDecimal(cleanVal);
        if (base === 16) setHex(cleanVal.toUpperCase());

        // Update source of truth if valid
        try {
            if (cleanVal) {
                const dec = BigInt(parseInt(cleanVal, base));
                setValue(dec.toString());
            }
        } catch (e) {
            // Ignore parse errors while typing
        }
    };

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showToast(`${label} copied!`, 'success');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Number Base Converter</h1>
                <p className={styles.description}>Convert numbers between Binary, Octal, Decimal, and Hexadecimal in real-time.</p>
            </header>

            <div className={styles.grid}>
                {/* Decimal */}
                <div className={styles.card}>
                    <label className={styles.label}>
                        Decimal <span className={styles.baseLabel}>Base 10</span>
                    </label>
                    <div className={styles.inputWrapper}>
                        <input
                            value={decimal}
                            onChange={(e) => handleChange(e.target.value, 10)}
                            className={styles.input}
                            placeholder="0-9"
                        />
                        <button onClick={() => copyToClipboard(decimal, 'Decimal')} className={styles.copyBtn}>
                            <Copy size={16} />
                        </button>
                    </div>
                </div>

                {/* Hex */}
                <div className={styles.card}>
                    <label className={styles.label}>
                        Hexadecimal <span className={styles.baseLabel}>Base 16</span>
                    </label>
                    <div className={styles.inputWrapper}>
                        <input
                            value={hex}
                            onChange={(e) => handleChange(e.target.value, 16)}
                            className={styles.input}
                            placeholder="0-9, A-F"
                        />
                        <button onClick={() => copyToClipboard(hex, 'Hex')} className={styles.copyBtn}>
                            <Copy size={16} />
                        </button>
                    </div>
                </div>

                {/* Binary */}
                <div className={styles.card}>
                    <label className={styles.label}>
                        Binary <span className={styles.baseLabel}>Base 2</span>
                    </label>
                    <div className={styles.inputWrapper}>
                        <input
                            value={binary}
                            onChange={(e) => handleChange(e.target.value, 2)}
                            className={styles.input}
                            placeholder="0-1"
                        />
                        <button onClick={() => copyToClipboard(binary, 'Binary')} className={styles.copyBtn}>
                            <Copy size={16} />
                        </button>
                    </div>
                </div>

                {/* Octal */}
                <div className={styles.card}>
                    <label className={styles.label}>
                        Octal <span className={styles.baseLabel}>Base 8</span>
                    </label>
                    <div className={styles.inputWrapper}>
                        <input
                            value={octal}
                            onChange={(e) => handleChange(e.target.value, 8)}
                            className={styles.input}
                            placeholder="0-7"
                        />
                        <button onClick={() => copyToClipboard(octal, 'Octal')} className={styles.copyBtn}>
                            <Copy size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
