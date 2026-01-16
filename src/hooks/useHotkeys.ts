
import { useEffect, useCallback } from 'react';

/**
 * Custom hook for handling keyboard shortcuts
 * 
 * @param {string} key - The key code to listen for (e.g., 'Enter', 'k', 'c')
 * @param {function} callback - Function to execute when shortcut is triggered
 * @param {object} options - Configuration options
 * @param {boolean} options.meta - Require Meta (Cmd) or Ctrl key
 * @param {boolean} options.shift - Require Shift key
 * @param {boolean} options.alt - Require Alt key
 * @param {boolean} options.preventDefault - Prevent default browser action (default: true)
 */

interface HotkeyOptions {
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    preventDefault?: boolean;
}

export function useHotkeys(key: string, callback: (event: KeyboardEvent) => void, options: HotkeyOptions = {}) {
    const {
        meta = false,
        shift = false,
        alt = false,
        preventDefault = true
    } = options;

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Check modifiers
        const metaPressed = event.metaKey || event.ctrlKey;
        const shiftPressed = event.shiftKey;
        const altPressed = event.altKey;

        // Check if requirements match
        if (
            event.key.toLowerCase() === key.toLowerCase() &&
            meta === metaPressed &&
            shift === shiftPressed &&
            alt === altPressed
        ) {
            if (preventDefault) {
                event.preventDefault();
            }
            callback(event);
        }
    }, [key, callback, meta, shift, alt, preventDefault]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown as any);
        return () => {
            document.removeEventListener('keydown', handleKeyDown as any);
        };
    }, [handleKeyDown]);
}
