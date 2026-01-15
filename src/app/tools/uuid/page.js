'use client';

import { useState } from 'react';
import { Copy, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

// UUID v1 (timestamp-based) - simplified implementation
function generateUUIDv1() {
    const now = Date.now();
    const hex = now.toString(16).padStart(12, '0');
    const random = crypto.getRandomValues(new Uint8Array(10));
    const randomHex = Array.from(random).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-1${randomHex.slice(0, 3)}-${(0x80 | (random[0] & 0x3f)).toString(16)}${randomHex.slice(4, 6)}-${randomHex.slice(6, 18)}`;
}

// UUID v4 (random)
function generateUUIDv4() {
    return crypto.randomUUID();
}

// UUID v7 (timestamp + random) - RFC 9562 compliant
function generateUUIDv7() {
    const now = Date.now();
    const random = crypto.getRandomValues(new Uint8Array(10));

    // First 48 bits: timestamp
    const hex = now.toString(16).padStart(12, '0');

    // Version 7 and variant bits
    const ver = '7';
    const variantByte = (0x80 | (random[0] & 0x3f)).toString(16).padStart(2, '0');
    const randomHex = Array.from(random.slice(1)).map(b => b.toString(16).padStart(2, '0')).join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${ver}${randomHex.slice(0, 3)}-${variantByte}${randomHex.slice(3, 5)}-${randomHex.slice(5, 17)}`;
}

const UUID_GENERATORS = {
    v1: { fn: generateUUIDv1, label: 'v1 (Timestamp)', description: 'Time-based UUID' },
    v4: { fn: generateUUIDv4, label: 'v4 (Random)', description: 'Random UUID (most common)' },
    v7: { fn: generateUUIDv7, label: 'v7 (Time-ordered)', description: 'Sortable, modern timestamp UUID' },
};

export default function UUIDTool() {
    const [version, setVersion] = useState('v4');
    const [uuids, setUuids] = useState([UUID_GENERATORS.v4.fn()]);
    const [count, setCount] = useState(1);
    const { showToast } = useToast();

    const handleGenerate = () => {
        const generator = UUID_GENERATORS[version].fn;
        const newUuids = Array.from({ length: count }, () => generator());
        setUuids(newUuids);
    };

    const handleCopy = (uuid) => {
        navigator.clipboard.writeText(uuid);
        showToast('UUID copied!', 'success');
    };

    const handleCopyAll = () => {
        navigator.clipboard.writeText(uuids.join('\n'));
        showToast(`${uuids.length} UUID(s) copied!`, 'success');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>UUID Generator</h1>
                <p className={styles.subtitle}>Generate UUIDs for your projects.</p>
            </header>

            <div className={styles.controls}>
                <div className={styles.countGroup}>
                    <label htmlFor="version" className={styles.label}>Version:</label>
                    <select
                        id="version"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        className={styles.versionSelect}
                    >
                        {Object.entries(UUID_GENERATORS).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.countGroup}>
                    <label htmlFor="count" className={styles.label}>Count:</label>
                    <input
                        id="count"
                        type="number"
                        min="1"
                        max="100"
                        value={count}
                        onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                        className={styles.countInput}
                    />
                </div>
                <button className={styles.generateBtn} onClick={handleGenerate}>
                    <RefreshCw size={16} /> Generate
                </button>
                <button className={styles.copyAllBtn} onClick={handleCopyAll}>
                    <Copy size={16} /> Copy All
                </button>
                <button className={styles.clearBtn} onClick={() => setUuids([])}>
                    <Trash2 size={16} /> Clear
                </button>
            </div>

            <p className={styles.versionHint}>{UUID_GENERATORS[version].description}</p>

            <div className={styles.uuidList}>
                {uuids.map((uuid, idx) => (
                    <div key={idx} className={styles.uuidItem}>
                        <code className={styles.uuidCode}>{uuid}</code>
                        <button className={styles.copyBtn} onClick={() => handleCopy(uuid)} title="Copy">
                            <Copy size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
