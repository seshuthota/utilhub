
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Flag, AlertTriangle, RefreshCw, Layers, BookOpen, ArrowRight, Copy } from 'lucide-react';
import AiAssistButton from '@/components/common/AiAssistButton';
import { useUrlState } from '@/hooks/useUrlState';
import { parseAiResponse, explainRegex, CHEATSHEET } from '@/utils/regex';
import styles from './page.module.css';
import { useToast } from '@/components/Toast';

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
                    prompt={`Create a JavaScript regex for: "${aiPrompt}". Return ONLY the regex in /pattern/flags format.`}
                    systemPrompt="You are a regex expert. Return ONLY /pattern/flags."
                    onResult={handleAiResult}
                    disabled={!aiPrompt.trim()}
                />
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
