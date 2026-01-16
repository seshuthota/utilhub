'use client';

import { useState, useMemo } from 'react';
import { Copy } from 'lucide-react';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

type ConverterFn = (str: string) => string;

// Case conversion functions
const converters: Record<string, ConverterFn> = {
    camelCase: (str) => {
        return str
            .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
            .replace(/^(.)/, (c) => c.toLowerCase());
    },
    PascalCase: (str) => {
        return str
            .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
            .replace(/^(.)/, (c) => c.toUpperCase());
    },
    snake_case: (str) => {
        return str
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[-\s]+/g, '_')
            .toLowerCase();
    },
    SCREAMING_SNAKE: (str) => {
        return str
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[-\s]+/g, '_')
            .toUpperCase();
    },
    'kebab-case': (str) => {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[_\s]+/g, '-')
            .toLowerCase();
    },
    'TRAIN-CASE': (str) => {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[_\s]+/g, '-')
            .toUpperCase();
    },
    'dot.case': (str) => {
        return str
            .replace(/([a-z])([A-Z])/g, '$1.$2')
            .replace(/[-_\s]+/g, '.')
            .toLowerCase();
    },
    'Title Case': (str) => {
        return str
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    },
    'Sentence case': (str) => {
        const result = str.replace(/[-_]+/g, ' ').toLowerCase();
        return result.charAt(0).toUpperCase() + result.slice(1);
    },
    lowercase: (str) => str.toLowerCase(),
    UPPERCASE: (str) => str.toUpperCase(),
    'aLtErNaTiNg': (str) => {
        return str
            .split('')
            .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
            .join('');
    },
};

const caseNames = Object.keys(converters);

export default function CaseConverterTool() {
    const [input, setInput] = useState('hello world example');
    const { showToast } = useToast();

    const results = useMemo(() => {
        if (!input.trim()) return {};
        return Object.fromEntries(
            caseNames.map((name) => [name, converters[name](input)])
        );
    }, [input]);

    const copyToClipboard = (text: string, caseName: string) => {
        navigator.clipboard.writeText(text);
        showToast(`${caseName} copied!`, 'success');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Text Case Converter</h1>
                <p className={styles.subtitle}>Convert text between different naming conventions.</p>
            </header>

            <div className={styles.inputSection}>
                <label className={styles.label}>Input Text</label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className={styles.textarea}
                    placeholder="Enter text to convert..."
                    rows={3}
                />
            </div>

            <div className={styles.resultsGrid}>
                {caseNames.map((name) => (
                    <div key={name} className={styles.resultCard}>
                        <div className={styles.cardHeader}>
                            <span className={styles.caseName}>{name}</span>
                            <button
                                className={styles.copyBtn}
                                onClick={() => copyToClipboard(results[name] || '', name)}
                                disabled={!results[name]}
                                title="Copy"
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                        <code className={styles.resultText}>
                            {results[name] || '—'}
                        </code>
                    </div>
                ))}
            </div>
        </div>
    );
}
