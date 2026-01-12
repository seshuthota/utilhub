'use client';

import { useState } from 'react';
import CryptoJS from 'crypto-js';
import { Shield, Copy, RefreshCw, FileText } from 'lucide-react';
import styles from './page.module.css';

export default function HashTool() {
    const [input, setInput] = useState('Hello World');

    const calculateHash = (algo, text) => {
        try {
            if (!text) return '';
            switch (algo) {
                case 'MD5': return CryptoJS.MD5(text).toString();
                case 'SHA1': return CryptoJS.SHA1(text).toString();
                case 'SHA256': return CryptoJS.SHA256(text).toString();
                case 'SHA512': return CryptoJS.SHA512(text).toString();
                default: return '';
            }
        } catch (e) {
            return 'Error';
        }
    };

    const hashes = [
        { label: 'MD5', val: calculateHash('MD5', input) },
        { label: 'SHA-1', val: calculateHash('SHA1', input) },
        { label: 'SHA-256', val: calculateHash('SHA256', input) },
        { label: 'SHA-512', val: calculateHash('SHA512', input) },
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Hash Generator</h1>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Input Text</h2>
                    <textarea
                        className={styles.textarea}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter text to hash..."
                    />
                    <div className={styles.info}>
                        <FileText size={14} /> Length: {input.length} chars
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
                                    onClick={() => navigator.clipboard.writeText(h.val)}
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
