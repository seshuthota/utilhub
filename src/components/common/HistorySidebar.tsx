'use client';

import { X, Trash2, History } from 'lucide-react';
import styles from './HistorySidebar.module.css';
import { CSSProperties, ReactNode } from 'react';

interface HistorySidebarProps<T = any> {
    history: T[];
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: T) => void;
    onClear: () => void;
    onDelete?: (index: number) => void;
    renderItem?: (item: T) => ReactNode;
    title?: string;
    className?: string;
    style?: CSSProperties;
}

/**
 * Reusable History Sidebar Component
 */
export default function HistorySidebar({
    history,
    isOpen,
    onClose,
    onSelect,
    onClear,
    onDelete,
    renderItem,
    title = 'History',
    className = '',
    style = {}
}: HistorySidebarProps) {
    if (!isOpen) return null;

    return (
        <>
            <div className={styles.sidebarOverlay} onClick={onClose} />
            <div className={`${styles.sidebar} ${className}`} style={style}>
                <div className={styles.header}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={18} />
                        {title}
                    </span>
                    <div className={styles.headerActions}>
                        {history.length > 0 && (
                            <button onClick={onClear} className={styles.clearBtn} title="Clear All">
                                <Trash2 size={14} /> Clear
                            </button>
                        )}
                        <button onClick={onClose} className={styles.closeBtn} title="Close">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className={styles.list}>
                    {history.length === 0 ? (
                        <div className={styles.emptyState}>
                            <History size={48} strokeWidth={1} />
                            <span>No history yet</span>
                        </div>
                    ) : (
                        history.map((item, index) => (
                            <div
                                key={index}
                                className={styles.item}
                                onClick={() => onSelect(item)}
                            >
                                <div className={styles.itemContent}>
                                    {renderItem ? renderItem(item) : (
                                        typeof item === 'string' ? item : JSON.stringify(item)
                                    )}
                                </div>
                                {onDelete && (
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(index);
                                        }}
                                        title="Remove item"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
