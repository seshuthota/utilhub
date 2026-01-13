'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Command } from 'lucide-react';
import { tools } from '@/config/tools';
import styles from './CommandPalette.module.css';

export default function CommandPalette({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const router = useRouter();

    const filteredTools = tools.filter(tool =>
        tool.title.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setActiveIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % filteredTools.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + filteredTools.length) % filteredTools.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredTools[activeIndex]) {
                    navigate(filteredTools[activeIndex].href);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredTools, activeIndex]);

    const navigate = (href) => {
        router.push(href);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className={styles.searchBox}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        placeholder="Search tools..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActiveIndex(0);
                        }}
                    />
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.results}>
                    {filteredTools.map((tool, index) => {
                        const Icon = tool.icon;
                        return (
                            <div
                                key={tool.id}
                                className={`${styles.option} ${index === activeIndex ? styles.active : ''}`}
                                onClick={() => navigate(tool.href)}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <div className={styles.optionIcon}>
                                    <Icon size={18} />
                                </div>
                                <div className={styles.optionContent}>
                                    <span className={styles.optionTitle}>{tool.title}</span>
                                    <span className={styles.optionDesc}>{tool.description}</span>
                                </div>
                                {index === activeIndex && <Command size={14} className={styles.enterHint} />}
                            </div>
                        );
                    })}
                    {filteredTools.length === 0 && (
                        <div className={styles.noResults}>
                            No tools found matching "{query}"
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <span><kbd className={styles.kbd}>↑</kbd> <kbd className={styles.kbd}>↓</kbd> to navigate</span>
                    <span><kbd className={styles.kbd}>↵</kbd> to select</span>
                    <span><kbd className={styles.kbd}>esc</kbd> to close</span>
                </div>
            </div>
        </div>
    );
}
