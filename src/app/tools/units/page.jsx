'use client';

import { useState, useMemo } from 'react';
import { ArrowRightLeft, Copy } from 'lucide-react';
import styles from './page.module.css';

const conversions = {
    bytes: {
        label: 'Data Size',
        units: ['B', 'KB', 'MB', 'GB', 'TB'],
        base: 1024,
        toBase: (v, unit) => v * Math.pow(1024, ['B', 'KB', 'MB', 'GB', 'TB'].indexOf(unit)),
        fromBase: (v, unit) => v / Math.pow(1024, ['B', 'KB', 'MB', 'GB', 'TB'].indexOf(unit)),
    },
    pixels: {
        label: 'CSS Units',
        units: ['px', 'rem', 'em', 'pt'],
        // Assuming 16px = 1rem = 1em, 1pt = 1.333px
        toBase: (v, unit) => {
            if (unit === 'px') return v;
            if (unit === 'rem' || unit === 'em') return v * 16;
            if (unit === 'pt') return v * 1.333;
            return v;
        },
        fromBase: (v, unit) => {
            if (unit === 'px') return v;
            if (unit === 'rem' || unit === 'em') return v / 16;
            if (unit === 'pt') return v / 1.333;
            return v;
        },
    },
    time: {
        label: 'Time',
        units: ['ms', 's', 'min', 'hr', 'days'],
        toBase: (v, unit) => {
            const factors = { ms: 1, s: 1000, min: 60000, hr: 3600000, days: 86400000 };
            return v * factors[unit];
        },
        fromBase: (v, unit) => {
            const factors = { ms: 1, s: 1000, min: 60000, hr: 3600000, days: 86400000 };
            return v / factors[unit];
        },
    },
};

export default function UnitsTool() {
    const [category, setCategory] = useState('bytes');
    const [value, setValue] = useState(1024);
    const [fromUnit, setFromUnit] = useState('KB');

    const conv = conversions[category];

    const results = useMemo(() => {
        const baseValue = conv.toBase(value, fromUnit);
        return conv.units.map(unit => ({
            unit,
            value: conv.fromBase(baseValue, unit),
        }));
    }, [category, value, fromUnit, conv]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Unit Converter</h1>
            </header>

            <div className={styles.categories}>
                {Object.entries(conversions).map(([key, c]) => (
                    <button
                        key={key}
                        className={`${styles.catBtn} ${category === key ? styles.active : ''}`}
                        onClick={() => { setCategory(key); setFromUnit(c.units[0]); }}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            <div className={styles.inputRow}>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className={styles.valueInput}
                />
                <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className={styles.unitSelect}
                >
                    {conv.units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>

            <div className={styles.results}>
                {results.map(r => (
                    <div key={r.unit} className={`${styles.resultRow} ${r.unit === fromUnit ? styles.highlight : ''}`}>
                        <span className={styles.resultValue}>{r.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                        <span className={styles.resultUnit}>{r.unit}</span>
                        <button
                            className={styles.copyBtn}
                            onClick={() => navigator.clipboard.writeText(r.value.toString())}
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
