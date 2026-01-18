"use client";

import React, { useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { sql } from '@codemirror/lang-sql';
import { markdown } from '@codemirror/lang-markdown';
import { yaml } from '@codemirror/lang-yaml';
import { StreamLanguage } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { EditorView } from '@codemirror/view';

interface CodeMirrorEditorProps {
    value: string;
    onChange?: (value: string) => void;
    language?: string;
    placeholder?: string;
    readOnly?: boolean;
    onRun?: () => void;
    className?: string;
    style?: React.CSSProperties;
    height?: string;
}

export default function CodeMirrorEditor({
    value,
    onChange,
    language = 'plaintext',
    placeholder,
    readOnly = false,
    onRun,
    className = '',
    style = {},
    height = '100%',
}: CodeMirrorEditorProps) {

    // Map language string to CodeMirror extension
    const extensions = useMemo(() => {
        const exts = [];

        // Language support
        switch (language.toLowerCase()) {
            case 'javascript':
            case 'js':
            case 'jsx':
            case 'ts':
            case 'tsx':
            case 'typescript':
                exts.push(javascript({ jsx: true, typescript: true }));
                break;
            case 'json':
                exts.push(json());
                break;
            case 'html':
            case 'xml':
            case 'markup':
                exts.push(html());
                break;
            case 'css':
                exts.push(css());
                break;
            case 'sql':
                exts.push(sql());
                break;
            case 'markdown':
            case 'md':
                exts.push(markdown());
                break;
            case 'yaml':
            case 'yml':
                exts.push(yaml());
                break;
            case 'bash':
            case 'sh':
            case 'shell':
                exts.push(StreamLanguage.define(shell));
                break;
            default:
                // Plain text fallback (no specific language extension needed)
                break;
        }

        // Keymaps
        if (onRun) {
            exts.push(keymap.of([
                {
                    key: "Mod-Enter",
                    run: () => {
                        onRun();
                        return true;
                    }
                }
            ]));
        }

        // ReadOnly specific styling or behavior if needed
        if (readOnly) {
            exts.push(EditorView.editable.of(false));
        }

        return exts;
    }, [language, onRun, readOnly]);

    const handleChange = useCallback((val: string) => {
        onChange?.(val);
    }, [onChange]);

    return (
        <div className={className} style={{ ...style, height, overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
            <CodeMirror
                value={value}
                height="100%"
                theme={oneDark}
                extensions={extensions}
                onChange={handleChange}
                placeholder={placeholder}
                editable={!readOnly}
                basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightSpecialChars: true,
                    history: true,
                    foldGutter: true,
                    drawSelection: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    syntaxHighlighting: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    closeBracketsKeymap: true,
                    defaultKeymap: true,
                    searchKeymap: true,
                    historyKeymap: true,
                    foldKeymap: true,
                    completionKeymap: true,
                    lintKeymap: true,
                }}
                style={{ fontSize: '14px', height: '100%' }}
            />
        </div>
    );
}
