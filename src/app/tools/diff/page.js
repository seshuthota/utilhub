'use client';

import { useState, useMemo } from 'react';
import * as diff from 'diff';
import clsx from 'clsx';
import styles from './page.module.css';
import { Split } from 'lucide-react';

export default function DiffTool() {
    const [oldText, setOldText] = useState('const foo = "bar";\nconsole.log(foo);');
    const [newText, setNewText] = useState('const foo = "baz";\nconsole.log("changed");');

    const differences = useMemo(() => {
        return diff.diffLines(oldText, newText);
    }, [oldText, newText]);

    return (
        <div className={styles.container}>
            <header style={{ marginTop: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Split size={24} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Diff Checker</h1>
            </header>

            <div className={styles.inputs}>
                <div className={styles.inputPane}>
                    <div className={styles.paneHeader}>Original Text</div>
                    <textarea
                        className={styles.textarea}
                        value={oldText}
                        onChange={(e) => setOldText(e.target.value)}
                        placeholder="Paste original text here..."
                    />
                </div>
                <div className={styles.inputPane}>
                    <div className={styles.paneHeader}>New Text</div>
                    <textarea
                        className={styles.textarea}
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Paste new text here..."
                    />
                </div>
            </div>

            <div className={styles.diffContainer}>
                {differences.map((part, index) => {
                    const colorClass = part.added ? styles.added : part.removed ? styles.removed : styles.neutral;
                    return (
                        <span key={index} className={`${styles.diffLine} ${colorClass}`}>
                            {part.value}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
