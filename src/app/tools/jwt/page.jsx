
'use client';

import { useState, useMemo } from 'react';
import { Key, Copy, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useUrlState } from '@/hooks/useUrlState';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useToast } from '@/components/Toast';
import { decodeJwt, getExpirationStatus } from '@/utils/jwt';
import ShareButton from '@/components/common/ShareButton';
import styles from './page.module.css';

export default function JwtTool() {
    const [token, setToken] = useUrlState('token', '');
    const { showToast } = useToast();

    // Decode logic
    const { header, payload, error } = useMemo(() => decodeJwt(token), [token]);

    // Status logic
    const expiration = useMemo(() => {
        if (!payload) return null;
        return getExpirationStatus(payload.exp);
    }, [payload]);

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text);
        showToast(`${label} copied to clipboard`, 'success');
    };

    // Keyboard Shortcuts
    useHotkeys('c', () => copyToClipboard(payload, 'Payload'), { meta: true, shift: true });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>JWT Decoder</h1>
                <ShareButton />
            </header>

            <div className={styles.grid}>
                {/* Input Column */}
                <div className={styles.column}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}><Key size={16} /> Encoded Token</span>
                            <button
                                className={styles.copyBtn}
                                onClick={() => copyToClipboard(token, 'Token')}
                                title="Copy Token"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                        <textarea
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className={styles.inputArea}
                            placeholder="Paste your JWT here (eyJ...)"
                            spellCheck={false}
                        />
                    </div>

                    {/* Status Bar */}
                    {expiration && (
                        <div className={`${styles.statusSection} ${styles[expiration.status]}`}>
                            <div className={styles.statusCard}>
                                <div className={styles.statusIcon}>
                                    {expiration.isExpired ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                                </div>
                                <div className={styles.statusInfo}>
                                    <span className={styles.statusLabel}>Status</span>
                                    <span className={styles.statusValue}>
                                        {expiration.isExpired ? 'Expired' : 'Valid Signature Format'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.statusCard}>
                                <div className={styles.statusIcon}>
                                    <Clock size={18} />
                                </div>
                                <div className={styles.statusInfo}>
                                    <span className={styles.statusLabel}>Expiration</span>
                                    <span className={styles.statusValue}>{expiration.text}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Output Column */}
                <div className={styles.column}>
                    {/* Header */}
                    <div className={styles.card} style={{ flex: 1 }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Header</span>
                            <button
                                className={styles.copyBtn}
                                onClick={() => copyToClipboard(header, 'Header')}
                                title="Copy Header"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                        <pre className={styles.jsonContent}>
                            {header ? JSON.stringify(header, null, 2) : <div className={styles.placeholder}>Waiting for token...</div>}
                        </pre>
                    </div>

                    {/* Payload */}
                    <div className={styles.card} style={{ flex: 2 }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Payload</span>
                            <button
                                className={styles.copyBtn}
                                onClick={() => copyToClipboard(payload, 'Payload')}
                                title="Copy Payload (Cmd+Shift+C)"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                        <pre className={styles.jsonContent}>
                            {payload ? JSON.stringify(payload, null, 2) : <div className={styles.placeholder}>Waiting for token...</div>}
                        </pre>
                    </div>

                    {error && (
                        <div style={{ color: '#ef4444', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                            Error: {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
