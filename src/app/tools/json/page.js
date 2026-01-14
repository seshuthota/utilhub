'use client';

import { useState } from 'react';
import { Braces, Copy, Trash2, Maximize, Minimize } from 'lucide-react';
import CodeEditor from '@/components/common/CodeEditor';
import ShareButton from '@/components/common/ShareButton';
import AiAssistButton from '@/components/common/AiAssistButton';

import { useUrlState } from '@/hooks/useUrlState';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useToast } from '@/components/Toast';
import styles from '../markdown/page.module.css';

export default function JsonTool() {
    const [code, setCode] = useUrlState('code', '{"name":"UtilHub","type":"Project","active":true}');
    const [aiPrompt, setAiPrompt] = useState('');
    const [error, setError] = useState(null);
    const { showToast } = useToast();

    const handleAiResult = (response) => {
        // AI should return valid JSON
        const cleaned = response.trim().replace(/^```json\n?|```javascript\n?|```\n?|```$/g, '');
        try {
            // Validate it's actual JSON
            const parsed = JSON.parse(cleaned);
            setCode(JSON.stringify(parsed, null, 2));
            setError(null);
        } catch (e) {
            // If not JSON, just set the text (maybe AI returned an explanation)
            setCode(cleaned);
        }
    };

    const formatJson = () => {
        try {
            const parsed = JSON.parse(code);
            setCode(JSON.stringify(parsed, null, 2));
            setError(null);
            showToast('JSON formatted successfully', 'success');
        } catch (e) {
            setError(e.message);
            showToast('Invalid JSON', 'error');
        }
    };

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(code);
            setCode(JSON.stringify(parsed));
            setError(null);
            showToast('JSON minified successfully', 'success');
        } catch (e) {
            setError(e.message);
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

            {error && <div className={styles.errorAlert}>Error: {error}</div>}

            <div className={styles.editorContainer}>
                <div className={styles.pane}>
                    <div className={styles.paneHeader}>
                        <span>Input / Output</span>
                        <span className={styles.languageBadge}>JSON</span>
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
        </div>
    );
}
