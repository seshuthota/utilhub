
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, Command } from 'lucide-react';
import { tools } from '@/config/tools';
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

    // Filtering
    const filteredTools = tools.filter(tool =>
        tool.title.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase()) ||
        tool.id.toLowerCase().includes(query.toLowerCase())
    );

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleNavigate = (path) => {
        router.push(path);
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredTools.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredTools.length) % filteredTools.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredTools[selectedIndex]) {
                handleNavigate(filteredTools[selectedIndex].href);
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
                    {filteredTools.map((tool, index) => {
                        const Icon = tool.icon;
                        return (
                            <button
                                key={tool.id}
                                className={`${styles.item} ${index === selectedIndex ? styles.activeItem : ''}`}
                                onClick={() => handleNavigate(tool.href)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className={styles.iconWrapper}>
                                    <Icon size={18} />
                                </div>
                                <div className={styles.content}>
                                    <span className={styles.title}>{tool.title}</span>
                                    <span className={styles.description}>{tool.description}</span>
                                </div>
                                {index === selectedIndex && (
                                    <CornerDownLeft size={14} className={styles.textSecondary} />
                                )}
                            </button>
                        );
                    })}
                    {filteredTools.length === 0 && (
                        <div className={styles.empty}>No tools found matching "{query}"</div>
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
