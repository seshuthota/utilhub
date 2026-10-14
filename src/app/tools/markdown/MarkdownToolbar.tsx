'use client';

import type { EditorView } from '@codemirror/view';
import {
    Bold, Italic, Strikethrough, Heading2, Link, Code, SquareCode, Quote,
    List, ListOrdered, ListChecks, Table, Minus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    toggleWrap, toggleLinePrefix, insertLink, insertBlock, insertCodeBlock, TABLE_TEMPLATE,
} from './editorCommands';
import styles from './page.module.css';

interface Action {
    label: string;
    shortcut?: string;
    icon: LucideIcon;
    run: (view: EditorView) => boolean;
}

const GROUPS: Action[][] = [
    [
        { label: 'Bold', shortcut: 'Mod+B', icon: Bold, run: (v) => toggleWrap(v, '**', 'bold text') },
        { label: 'Italic', shortcut: 'Mod+I', icon: Italic, run: (v) => toggleWrap(v, '_', 'italic text') },
        { label: 'Strikethrough', icon: Strikethrough, run: (v) => toggleWrap(v, '~~', 'text') },
        { label: 'Inline code', shortcut: 'Mod+E', icon: Code, run: (v) => toggleWrap(v, '`', 'code') },
    ],
    [
        { label: 'Heading', icon: Heading2, run: (v) => toggleLinePrefix(v, '## ') },
        { label: 'Quote', icon: Quote, run: (v) => toggleLinePrefix(v, '> ') },
        { label: 'Bulleted list', icon: List, run: (v) => toggleLinePrefix(v, '- ') },
        { label: 'Numbered list', icon: ListOrdered, run: (v) => toggleLinePrefix(v, '1. ') },
        { label: 'Task list', icon: ListChecks, run: (v) => toggleLinePrefix(v, '- [ ] ') },
    ],
    [
        { label: 'Link', shortcut: 'Mod+K', icon: Link, run: insertLink },
        { label: 'Code block', icon: SquareCode, run: insertCodeBlock },
        { label: 'Table', icon: Table, run: (v) => insertBlock(v, TABLE_TEMPLATE, 'Column') },
        { label: 'Divider', icon: Minus, run: (v) => insertBlock(v, '---') },
    ],
];

function shortcutLabel(shortcut: string): string {
    const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
    return shortcut.replace('Mod', mac ? '⌘' : 'Ctrl');
}

interface MarkdownToolbarProps {
    getView: () => EditorView | null;
}

export default function MarkdownToolbar({ getView }: MarkdownToolbarProps) {
    return (
        <div className={styles.formatBar} role="toolbar" aria-label="Formatting">
            {GROUPS.map((group, i) => (
                <div key={i} className={styles.formatGroup}>
                    {group.map(({ label, shortcut, icon: Icon, run }) => {
                        const title = shortcut ? `${label} (${shortcutLabel(shortcut)})` : label;
                        return (
                            <button
                                key={label}
                                type="button"
                                className={styles.formatButton}
                                title={title}
                                aria-label={label}
                                // Keep the editor's selection: don't let the button steal focus first
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    const view = getView();
                                    if (view) run(view);
                                }}
                            >
                                <Icon size={15} aria-hidden />
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
