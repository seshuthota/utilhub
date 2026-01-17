'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, Settings, Search } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import CommandPalette from '@/components/common/CommandPalette';

import styles from './Header.module.css';

/**
 * Main application header with logo, global search trigger, and navigation/theme toggle.
 * Handles the global Command Palette shortcut (Cmd/Ctrl+K).
 */
export default function Header() {
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsPaletteOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <header className={styles.header}>
                <div className={styles.container}>
                    <Link href="/" className={styles.logo}>
                        <Terminal size={24} />
                        <span className={styles.logoText}>UtilHub</span>
                    </Link>

                    <button
                        className={styles.searchTrigger}
                        onClick={() => setIsPaletteOpen(true)}
                    >
                        <Search size={16} />
                        <span>Search tools...</span>
                        <kbd className={styles.shortcut}>⌘K</kbd>
                    </button>

                    <nav className={styles.nav}>
                        <ThemeToggle />
                        <Link href="/settings" className={styles.navItem} aria-label="Settings">
                            <Settings size={20} />
                        </Link>
                    </nav>
                </div>
            </header>
            <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
        </>
    );
}
