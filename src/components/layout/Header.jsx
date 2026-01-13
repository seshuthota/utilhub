'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, Settings, Github, Search } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import CommandPalette from '@/components/common/CommandPalette';
import styles from './Header.module.css';

export default function Header() {
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
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
                        <a
                            href="https://github.com/seshuthota/utilhub"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.navItem}
                            aria-label="GitHub Repository"
                        >
                            <Github size={20} />
                        </a>
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
