'use client';

import { useState, useMemo } from 'react';
import cronstrue from 'cronstrue';
import cronParser from 'cron-parser';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/Toast';
import AiAssistBar from '@/components/common/AiAssistBar';
import styles from './page.module.css';

interface CronResult {
    description: string | null;
    nextRuns: Date[];
    error: string | null;
}

export default function CronTool() {
    const [expression, setExpression] = useState('*/5 * * * *');
    const [aiPrompt, setAiPrompt] = useState('');
    const { showToast } = useToast();

    const result = useMemo<CronResult>(() => {
        try {
            if (!expression.trim()) return { description: null, nextRuns: [], error: null };

            const description = cronstrue.toString(expression);
            const interval = (cronParser as any).parse(expression);

            const nextRuns: Date[] = [];
            for (let i = 0; i < 5; i++) {
                nextRuns.push(interval.next().toDate());
            }

            return { description, nextRuns, error: null };
        } catch (e: any) {
            return { description: null, nextRuns: [], error: e.message };
        }
    }, [expression]);

    const handleAiResult = (response: string) => {
        // AI should return JUST the cron expression
        const cleaned = response.trim().replace(/^`+|`+$/g, '');
        // Validate before setting
        try {
            (cronParser as any).parse(cleaned);
            setExpression(cleaned);
        } catch (e) {
            showToast('AI returned an invalid cron expression', 'error');
        }
    };

    const presets = [
        { label: 'Every minute', value: '* * * * *' },
        { label: 'Every 5 minutes', value: '*/5 * * * *' },
        { label: 'Every hour', value: '0 * * * *' },
        { label: 'Daily at midnight', value: '0 0 * * *' },
        { label: 'Weekly on Sunday', value: '0 0 * * 0' },
        { label: 'Monthly 1st', value: '0 0 1 * *' },
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Cron Expression Parser</h1>
            </header>

            {/* AI Assist Section */}
            <AiAssistBar
                prompt={aiPrompt}
                onPromptChange={setAiPrompt}
                type="cron"
                onResult={handleAiResult}
                placeholder="Describe when to run (e.g., 'every Monday at 3 PM', 'first day of month')"
            />

            <div className={styles.grid}>
                <div className={styles.inputPanel}>
                    <div className={styles.inputGroup}>
                        <label>Cron Expression</label>
                        <input
                            type="text"
                            value={expression}
                            onChange={(e) => setExpression(e.target.value)}
                            className={styles.input}
                            placeholder="* * * * *"
                        />
                    </div>

                    <div className={styles.presets}>
                        <label>Presets</label>
                        <div className={styles.presetGrid}>
                            {presets.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => setExpression(p.value)}
                                    className={styles.presetBtn}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.format}>
                        <code>┌───────────── minute (0-59)</code>
                        <code>│ ┌───────────── hour (0-23)</code>
                        <code>│ │ ┌───────────── day of month (1-31)</code>
                        <code>│ │ │ ┌───────────── month (1-12)</code>
                        <code>│ │ │ │ ┌───────────── day of week (0-6)</code>
                        <code>* * * * *</code>
                    </div>
                </div>

                <div className={styles.resultPanel}>
                    {result.error ? (
                        <div className={styles.error}>
                            <AlertTriangle size={16} /> {result.error}
                        </div>
                    ) : result.description ? (
                        <>
                            <div className={styles.descriptionCard}>
                                <Clock size={20} />
                                <span>{result.description}</span>
                            </div>

                            <div className={styles.nextRuns}>
                                <h3>Next 5 Runs</h3>
                                <ul className={styles.runList}>
                                    {result.nextRuns.map((date, i) => (
                                        <li key={i}>
                                            <Calendar size={14} />
                                            {date.toLocaleString()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className={styles.placeholder}>Enter a cron expression</div>
                    )}
                </div>
            </div>
        </div>
    );
}
