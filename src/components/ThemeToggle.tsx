'use client';

import { useTheme, THEMES } from './ThemeProvider';
import { Sun, Moon, Palette } from 'lucide-react';
import styles from './ThemeToggle.module.css';

/**
 * Button that cycles through the available themes.
 * Uses the ThemeProvider context.
 */
export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const index = THEMES.findIndex((t) => t.id === theme);
    const next = THEMES[(index + 1) % THEMES.length];
    const Icon = theme === 'dark' ? Sun : theme === 'light' ? Moon : Palette;

    return (
        <button
            onClick={toggleTheme}
            className={styles.toggle}
            aria-label={`Theme: ${THEMES[index]?.name ?? theme}. Switch to ${next.name}`}
            title={`Switch to ${next.name}`}
        >
            <Icon size={18} aria-hidden />
        </button>
    );
}
