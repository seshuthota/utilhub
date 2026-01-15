'use client';

import { useState } from 'react';
import { Braces, Copy, Trash2, Maximize, Minimize, History } from 'lucide-react';
import CodeEditor from '@/components/common/CodeEditor';
import ShareButton from '@/components/common/ShareButton';
import AiAssistButton from '@/components/common/AiAssistButton';
import HistorySidebar from '@/components/common/HistorySidebar';

import { useUrlState } from '@/hooks/useUrlState';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useHistory } from '@/hooks/useHistory';
import { useToast } from '@/components/Toast';
import ActionToolbar from '@/components/common/ActionToolbar';
import { parseJsonError } from '@/utils/errorParser';
import styles from '../markdown/page.module.css';

const HISTORY_KEY = 'utilhub_json_history';

export default function JsonTool() {
    const [code, setCode] = useUrlState('code', '{"name":"UtilHub","type":"Project","active":true}');
    const [aiPrompt, setAiPrompt] = useState('');
    const [error, setError] = useState(null);
    const { history, addToHistory, clearHistory } = useHistory(HISTORY_KEY, 20);
    const [showHistory, setShowHistory] = useState(false);
    const { showToast } = useToast();

    const handleAiResult = (response) => {
        // AI should return valid JSON
        const cleaned = response.trim().replace(/^```json\n?|```javascript\n?|```\n?|```$/g, '');
        try {
            // Validate it's actual JSON
            const parsed = JSON.parse(cleaned);
            const formatted = JSON.stringify(parsed, null, 2);
            setCode(formatted);
            addToHistory({ content: formatted, type: 'AI Generation', timestamp: Date.now() });
            setError(null);
        } catch (e) {
            // If not JSON, just set the text (maybe AI returned an explanation)
            setCode(cleaned);
        }
    };

    const formatJson = () => {
        try {
            const parsed = JSON.parse(code);
            const formatted = JSON.stringify(parsed, null, 2);
            setCode(formatted);
            // Save to history only if it's different from the last entry (optional, simplifed here)
            addToHistory({ content: formatted, type: 'Format', timestamp: Date.now() });
            setError(null);
            showToast('JSON formatted successfully', 'success');
        } catch (e) {
            setError(parseJsonError(e, code));
            showToast('Invalid JSON', 'error');
        }
    };

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(code);
            const minified = JSON.stringify(parsed);
            setCode(minified);
            addToHistory({ content: minified, type: 'Minify', timestamp: Date.now() });
            setError(null);
            showToast('JSON minified successfully', 'success');
        } catch (e) {
            setError(parseJsonError(e, code));
            showToast('Invalid JSON', 'error');
        }
    };

    const cleanJson = () => {
        setCode('');
        setError(null);
    };


    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        showToast('Copied to clipboard', 'success');
    };

    const loadFromHistory = (item) => {
        setCode(item.content);
        setShowHistory(false);
        showToast('Restored from history', 'success');
    };

    // Keyboard Shortcuts
    useHotkeys('Enter', formatJson, { meta: true });
    useHotkeys('m', minifyJson, { meta: true, shift: true });
    useHotkeys('c', copyToClipboard, { meta: true, shift: true });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>JSON Formatter</h1>
                <div className={styles.actions}>
                    <ShareButton />
                    <button
                        className={styles.button}
                        onClick={() => setShowHistory(true)}
                        title="History"
                    >
                        <History size={16} /> History
                    </button>
                    <button className={styles.button} onClick={formatJson} title="Format (Cmd/Ctrl + Enter)">
                        <Maximize size={16} /> Format
                    </button>
                    <button className={styles.button} onClick={minifyJson} title="Minify">
                        <Minimize size={16} /> Minify
                    </button>
                    <button className={styles.button} onClick={copyToClipboard} title="Copy">
                        <Copy size={16} /> Copy
                    </button>
                    <button className={styles.button} onClick={cleanJson} title="Clear">
                        <Trash2 size={16} /> Clear
                    </button>
                </div>
            </header>

            {/* AI Assist Section */}
            <div style={{
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
                        placeholder="e.g., 'fix this broken JSON', 'convert this list to JSON', 'generate 5 user objects'"
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
                        prompt={`Perform the following task on JSON/data: "${aiPrompt}". ${code ? `Current input: ${code}` : ''}. Return ONLY the valid JSON result.`}
                        systemPrompt="You are a JSON assistant. Return ONLY the valid JSON data. No text before or after. If repairing JSON, fix syntax errors like missing commas or quotes."
                        onResult={handleAiResult}
                        disabled={!aiPrompt.trim()}
                    />
                </div>
            </div>

            {error && (
                <div className={styles.errorAlert}>
                    <div style={{ fontWeight: 600 }}>{error.message || error}</div>
                    {error.line && (
                        <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            Found at Line {error.line}, Column {error.col}
                        </div>
                    )}
                    {error.suggestion && (
                        <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.9, fontStyle: 'italic' }}>
                            💡 Tip: {error.suggestion}
                        </div>
                    )}
                </div>
            )}

            <div className={styles.editorContainer}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <span>Input / Output</span>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <ActionToolbar content={code} currentToolId="json" />
                            <span className={styles.languageBadge}>JSON</span>
                        </div>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeEditor
                            value={code}
                            onChange={code => setCode(code)}
                            language="json"
                            placeholder="Paste your JSON here..."
                            onRun={formatJson}
                        />
                    </div>
                </div>
            </div>

            <HistorySidebar
                history={history}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                onClear={clearHistory}
                onSelect={loadFromHistory}
                title="JSON History"
                renderItem={(item) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {item.type} • {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                        <div style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
                            {item.content.substring(0, 50)}
                        </div>
                    </div>
                )}
            />
        </div>
    );
}
