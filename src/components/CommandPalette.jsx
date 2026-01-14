
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, Command } from 'lucide-react';

import { tools } from '@/config/tools';
import { useTheme } from './ThemeProvider';
import styles from './CommandPalette.module.css';

export default function CommandPalette() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Toggle with shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => inputRef.current?.focus(), 50); // Small delay to ensure render
        } else {
            document.body.style.overflow = 'unset';
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);


    const { setTheme, availableThemes } = useTheme();

    const themeCommands = availableThemes ? availableThemes.map(t => ({
        id: `theme-${t.id}`,
        title: `Theme: ${t.name}`,
        description: `Switch to ${t.name} theme`,
        icon: Monitor,
        action: () => {
            setTheme(t.id);
            setIsOpen(false);
            // Optional: show toast
        }
    })) : [];

    const allItems = [...tools, ...themeCommands];

    // Filtering
    const filteredItems = allItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
    );

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleSelect = (item) => {
        if (item.action) {
            item.action();
        } else if (item.href) {
            router.push(item.href);
            setIsOpen(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                handleSelect(filteredItems[selectedIndex]);
            }
        }
    };

    // Auto-scroll to active item
    useEffect(() => {
        if (listRef.current && listRef.current.children[selectedIndex]) {
            listRef.current.children[selectedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.inputWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        ref={inputRef}
                        className={styles.input}
                        placeholder="Search for tools..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className={styles.shortcut} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ESC</kbd>
                </div>


                <div className={styles.list} ref={listRef}>
                    {filteredItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                className={`${styles.item} ${index === selectedIndex ? styles.activeItem : ''}`}
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className={styles.iconWrapper}>
                                    <Icon size={18} />
                                </div>
                                <div className={styles.content}>
                                    <span className={styles.title}>{item.title}</span>
                                    <span className={styles.description}>{item.description}</span>
                                </div>
                                {index === selectedIndex && (
                                    <CornerDownLeft size={14} className={styles.textSecondary} />
                                )}
                            </button>
                        );
                    })}
                    {filteredItems.length === 0 && (
                        <div className={styles.empty}>No commands found matching "{query}"</div>
                    )}
                </div>

                <div className={styles.footer}>
                    <span><kbd className={styles.shortcut}>⇅</kbd> to navigate</span>
                    <span><kbd className={styles.shortcut}>↵</kbd> to select</span>
                </div>
            </div>
        </div>
    );
}
