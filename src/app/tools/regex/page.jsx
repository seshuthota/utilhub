'use client';

import { useState, useMemo } from 'react';
import { Search, Flag, AlertTriangle, RefreshCw } from 'lucide-react';
import AiAssistButton from '@/components/common/AiAssistButton';
import styles from './page.module.css';

export default function RegexTool() {
    const [pattern, setPattern] = useState('\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b');
    const [flags, setFlags] = useState('gm');
    const [text, setText] = useState('Contact us at support@utilhub.com or hello@example.org for more info.');
    const [aiPrompt, setAiPrompt] = useState('');

    const result = useMemo(() => {
        try {
            if (!pattern) return { matches: [], error: null };
            const regex = new RegExp(pattern, flags);
            const matches = Array.from(text.matchAll(regex));
            return { matches, error: null };
        } catch (e) {
            return { matches: [], error: e.message };
        }
    }, [pattern, flags, text]);

    const handleAiResult = (response) => {
        // Extract regex from AI response (look for patterns between / /)
        const regexMatch = response.match(/\/(.+?)\/([gimsuvy]*)?/);
        if (regexMatch) {
            setPattern(regexMatch[1]);
            if (regexMatch[2]) setFlags(regexMatch[2]);
        } else {
            // If no regex format, try to use the whole response as pattern
            setPattern(response.trim());
        }
    };

    const highlightText = () => {
        if (result.error || !pattern) return text;

        let lastIndex = 0;
        const parts = [];

        result.matches.forEach((match, i) => {
            // Non-match text before
            if (match.index > lastIndex) {
                parts.push(<span key={`text-${i}`}>{text.slice(lastIndex, match.index)}</span>);
            }
            // Match text
            parts.push(
                <span key={`match-${i}`} className={styles.highlight}>
                    {match[0]}
                </span>
            );
            lastIndex = match.index + match[0].length;
        });

        // Remaining text
        if (lastIndex < text.length) {
            parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
        }

        return parts.length > 0 ? parts : text;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Regex Tester</h1>
            </header>

            {/* AI Assist Section */}
            <div className={styles.aiSection} style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(147, 51, 234, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(147, 51, 234, 0.2)'
            }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe what you want to match (e.g., 'phone numbers', 'URLs', 'dates')"
                        style={{
                            flex: 1,
                            padding: '0.6rem 1rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: 'var(--foreground)',
                            fontSize: '0.9rem'
                        }}
                    />
                    <AiAssistButton
                        prompt={`Generate a JavaScript regex pattern to match: ${aiPrompt}. Return ONLY the regex in /pattern/flags format, nothing else.`}
                        systemPrompt="You are a regex expert. Return only the regex pattern in /pattern/flags format. No explanations."
                        onResult={handleAiResult}
                        disabled={!aiPrompt.trim()}
                    />
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.controls}>
                    <div className={styles.inputGroup}>
                        <label>Pattern</label>
                        <div className={styles.regexInput}>
                            <span className={styles.slash}>/</span>
                            <input
                                type="text"
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                className={styles.patternField}
                            />
                            <span className={styles.slash}>/</span>
                            <input
                                type="text"
                                value={flags}
                                onChange={(e) => setFlags(e.target.value)}
                                className={styles.flagsField}
                                placeholder="flags"
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Test String</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className={styles.textarea}
                        />
                    </div>

                    {result.error && (
                        <div className={styles.error}>
                            <AlertTriangle size={16} /> {result.error}
                        </div>
                    )}
                </div>

                <div className={styles.results}>
                    <h2 className={styles.sectionTitle}>
                        Results ({result.matches.length} matches)
                    </h2>

                    <div className={styles.preview}>
                        <pre className={styles.pre}>
                            {highlightText()}
                        </pre>
                    </div>

                    <div className={styles.matchList}>
                        {result.matches.map((m, i) => (
                            <div key={i} className={styles.matchItem}>
                                <div className={styles.matchHeader}>
                                    Match {i + 1}: <span className={styles.index}>Index: {m.index}</span>
                                </div>
                                <div className={styles.matchContent}>{m[0]}</div>
                                {m.length > 1 && (
                                    <div className={styles.groups}>
                                        {Array.from(m).slice(1).map((g, gi) => (
                                            <div key={gi} className={styles.groupItem}>
                                                Group {gi + 1}: {g}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
