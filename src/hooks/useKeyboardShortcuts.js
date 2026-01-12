'use client';

import { useEffect } from 'react';

export function useKeyboardShortcut(key, callback, modifiers = { ctrl: false, meta: false, shift: false }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            const ctrlOrMeta = (modifiers.ctrl && e.ctrlKey) || (modifiers.meta && e.metaKey);
            const shiftMatch = modifiers.shift ? e.shiftKey : true;

            if (e.key.toLowerCase() === key.toLowerCase() && ctrlOrMeta && shiftMatch) {
                e.preventDefault();
                callback(e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [key, callback, modifiers]);
}

// Common shortcuts hook for tool pages
export function useCommonShortcuts({ onFormat, onCopy, onClear }) {
    // Cmd/Ctrl + S = Format
    useKeyboardShortcut('s', () => onFormat?.(), { meta: true, ctrl: true });

    // Cmd/Ctrl + Shift + C = Copy
    useKeyboardShortcut('c', () => onCopy?.(), { meta: true, ctrl: true, shift: true });

    // Cmd/Ctrl + Shift + X = Clear
    useKeyboardShortcut('x', () => onClear?.(), { meta: true, ctrl: true, shift: true });
}
