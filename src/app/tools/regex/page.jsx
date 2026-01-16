
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Flag, AlertTriangle, RefreshCw, Layers, BookOpen, ArrowRight, Copy, Zap } from 'lucide-react';
import AiAssistButton from '@/components/common/AiAssistButton';

import { parseAiResponse, explainRegex, CHEATSHEET } from '@/utils/regex';
import { useUrlState } from '@/hooks/useUrlState';
import { useHotkeys } from '@/hooks/useHotkeys';
import styles from './page.module.css';
import { useToast } from '@/components/Toast';

// Common Regex Presets
const PRESETS = [
    { name: 'Email', pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}', flags: 'gi', sample: 'test@example.com' },
    { name: 'Phone (US)', pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', flags: 'g', sample: '(555) 123-4567' },
    { name: 'URL', pattern: 'https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&\'()*+,;=%]+', flags: 'gi', sample: 'https://example.com' },
    { name: 'IPv4', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b', flags: 'g', sample: '192.168.1.1' },
    { name: 'Date (ISO)', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g', sample: '2024-01-15' },
    { name: 'Time (24h)', pattern: '([01]?\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?', flags: 'g', sample: '14:30:00' },
    { name: 'Hex Color', pattern: '#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b', flags: 'gi', sample: '#FF5733' },
    { name: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', flags: 'gi', sample: '550e8400-e29b-41d4-a716-446655440000' },
    { name: 'Username', pattern: '^[a-zA-Z][a-zA-Z0-9_]{2,15}$', flags: '', sample: 'john_doe123' },
    { name: 'Strong Password', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', flags: '', sample: 'Pass@123' },
];

export default function RegexTool() {
    const [pattern, setPattern] = useUrlState('pattern', '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b');
    const [flags, setFlags] = useUrlState('flags', 'gm');
    const [text, setText] = useUrlState('text', 'Contact us at support@utilhub.com or hello@example.org for more info.');
    const [replaceText, setReplaceText] = useUrlState('replace', 'REDACTED');

    const [mode, setMode] = useState('match'); // match | replace
    const [aiPrompt, setAiPrompt] = useState('');
    const { showToast } = useToast();

    // Computing Results
    const result = useMemo(() => {
        try {
            if (!pattern) return { matches: [], error: null, replaced: '' };
            const regex = new RegExp(pattern, flags);
            const matches = Array.from(text.matchAll(regex));
            const replaced = text.replace(regex, replaceText);
            return { matches, error: null, replaced };
        } catch (e) {
            return { matches: [], error: e.message, replaced: '' };
        }
    }, [pattern, flags, text, replaceText]);

    // Safety Check
    const isDangerous = useMemo(() => {
        const nestedQuantifier = /\[[^\]]*\][+*?]\{[+*?]|(\([^)]*\)[+*?]){2,}|([+*?]\){1,})/;
        return nestedQuantifier.test(pattern);
    }, [pattern]);

    // Explainer
    const explanation = useMemo(() => explainRegex(pattern), [pattern]);

    const handleAiResult = (response) => {
        const { pattern: newPattern, flags: newFlags } = parseAiResponse(response);
        if (newPattern) {
            setPattern(newPattern);
            if (newFlags) setFlags(newFlags);
            showToast('Regex updated from AI', 'success');
        }
    };

    const insertToken = (code) => {
        setPattern(prev => prev + code);
    };

    const loadPreset = (preset) => {
        setPattern(preset.pattern);
        setFlags(preset.flags);
        setText(preset.sample);
        showToast(`Loaded "${preset.name}" preset`, 'success');
    };

    const highlightText = () => {
        if (result.error || !pattern) return text;

        let lastIndex = 0;
        const parts = [];

        result.matches.forEach((match, i) => {
            if (match.index > lastIndex) {
                parts.push(<span key={`text-${i}`}>{text.slice(lastIndex, match.index)}</span>);
            }
            parts.push(
                <span key={`match-${i}`} className={styles.highlight}>
                    {match[0]}
                </span>
            );
            lastIndex = match.index + match[0].length;
        });

        if (lastIndex < text.length) {
            parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
        }

        return parts.length > 0 ? parts : text;
    };

    // Keyboard Shortcuts
    useHotkeys('Enter', () => setMode(prev => prev === 'match' ? 'replace' : 'match'), { meta: true });
    useHotkeys('c', () => {
        const content = mode === 'match'
            ? result.matches.map(m => m[0]).join('\n')
            : result.replaced;
        navigator.clipboard.writeText(content);
        showToast('Result copied to clipboard', 'success');
    }, { meta: true, shift: true });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Regex Studio</h1>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${mode === 'match' ? styles.activeTab : ''}`}
                        onClick={() => setMode('match')}
                    >
                        <Search size={14} /> Match
                    </button>
                    <button
                        className={`${styles.tab} ${mode === 'replace' ? styles.activeTab : ''}`}
                        onClick={() => setMode('replace')}
                    >
                        <RefreshCw size={14} /> Replace
                    </button>
                </div>
            </header>

            {/* AI Assist */}
            <div className={styles.aiSection}>
                <input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask AI (e.g., 'match IPv4 addresses', 'extract dates')"
                    className={styles.aiInput}
                />

                <AiAssistButton
                    type={pattern ? 'regex-edit' : 'regex-create'}
                    payload={{ description: aiPrompt, pattern, flags }}
                    onResult={handleAiResult}
                    disabled={!aiPrompt.trim()}
                />
            </div>

            {/* Presets */}
            <div className={styles.presetsSection}>
                <div className={styles.presetsHeader}>
                    <Zap size={14} />
                    <span>Quick Presets</span>
                </div>
                <div className={styles.presetsRow}>
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            className={styles.presetBtn}
                            onClick={() => loadPreset(preset)}
                            title={preset.sample}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.grid}>
                {/* Left Column: Input & Results */}
                <div className={styles.mainColumn}>
                    <div className={styles.inputGroup}>
                        <div className={styles.regexBar}>
                            <span className={styles.slash}>/</span>
                            <input
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                className={styles.patternInput}
                                placeholder="Regex Pattern"
                            />
                            <span className={styles.slash}>/</span>
                            <input
                                value={flags}
                                onChange={(e) => setFlags(e.target.value)}
                                className={styles.flagsInput}
                                placeholder="gims"
                            />
                        </div>
                    </div>

                    {mode === 'replace' && (
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Replace With</label>
                            <input
                                value={replaceText}
                                onChange={(e) => setReplaceText(e.target.value)}
                                className={styles.replaceInput}
                                placeholder="Replacement text..."
                            />
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Test String</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className={styles.testArea}
                            placeholder="Enter text to test against..."
                        />
                    </div>

                    {result.error && (
                        <div className={styles.error}>
                            <AlertTriangle size={16} />Invalid Regex: {result.error}
                        </div>
                    )}

                    {isDangerous && (
                        <div className={styles.warning}>
                            <AlertTriangle size={16} /> Possible Catastrophic Backtracking detected!
                        </div>
                    )}

                    <div className={styles.resultPanel}>
                        <label className={styles.label}>
                            {mode === 'match' ? 'Matches' : 'Result'}
                            {result.matches.length > 0 && <span className={styles.badge}>{result.matches.length}</span>}
                        </label>
                        <div className={styles.preview}>
                            {mode === 'match' ? (
                                <pre className={styles.preContent}>{highlightText()}</pre>
                            ) : (
                                <pre className={styles.preContent}>{result.replaced}</pre>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Explainer & Cheatsheet */}
                <div className={styles.sideColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}><Layers size={16} /> Explanation</h3>
                        <div className={styles.explanationList}>
                            {explanation.map((item, i) => (
                                <div key={i} className={styles.explainItem}>
                                    <span className={styles.explainToken}>{item.token}</span>
                                    <div className={styles.explainContent}>
                                        <span className={styles.explainLabel}>{item.label}</span>
                                        <span className={styles.explainDesc}>{item.description}</span>
                                    </div>
                                </div>
                            ))}
                            {explanation.length === 0 && <div className={styles.emptyText}>Enter a pattern to see explanation</div>}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}><BookOpen size={16} /> Cheatsheet</h3>
                        <div className={styles.cheatGrid}>
                            {CHEATSHEET.map((item, i) => (
                                <button key={i} className={styles.cheatItem} onClick={() => insertToken(item.code)}>
                                    <code>{item.code}</code>
                                    <span>{item.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
