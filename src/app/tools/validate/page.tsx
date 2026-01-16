'use client';

import { useState } from 'react';
import { Mail, Link as LinkIcon, CheckCircle, XCircle } from 'lucide-react';
import styles from './page.module.css';

export default function ValidateTool() {
    const [input, setInput] = useState('');
    const [type, setType] = useState<'email' | 'url'>('email');

    const validateEmail = (email: string) => {
        const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return regex.test(email);
    };

    const validateUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const isValid = type === 'email' ? validateEmail(input) : validateUrl(input);
    const hasInput = input.trim().length > 0;

    const getUrlDetails = () => {
        try {
            const url = new URL(input);
            return {
                protocol: url.protocol,
                host: url.host,
                pathname: url.pathname,
                search: url.search,
                hash: url.hash,
            };
        } catch {
            return null;
        }
    };

    const urlDetails = type === 'url' && hasInput && isValid ? getUrlDetails() : null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Email & URL Validator</h1>
            </header>

            <div className={styles.content}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${type === 'email' ? styles.active : ''}`}
                        onClick={() => { setType('email'); setInput(''); }}
                    >
                        <Mail size={16} /> Email
                    </button>
                    <button
                        className={`${styles.tab} ${type === 'url' ? styles.active : ''}`}
                        onClick={() => { setType('url'); setInput(''); }}
                    >
                        <LinkIcon size={16} /> URL
                    </button>
                </div>

                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={type === 'email' ? 'Enter email address...' : 'Enter URL...'}
                        className={`${styles.input} ${hasInput ? (isValid ? styles.valid : styles.invalid) : ''}`}
                    />
                    {hasInput && (
                        <div className={styles.status}>
                            {isValid ? (
                                <CheckCircle size={24} className={styles.iconValid} />
                            ) : (
                                <XCircle size={24} className={styles.iconInvalid} />
                            )}
                        </div>
                    )}
                </div>

                {hasInput && (
                    <div className={`${styles.result} ${isValid ? styles.resultValid : styles.resultInvalid}`}>
                        {isValid ? (
                            <span><CheckCircle size={16} /> Valid {type}</span>
                        ) : (
                            <span><XCircle size={16} /> Invalid {type} format</span>
                        )}
                    </div>
                )}

                {urlDetails && (
                    <div className={styles.details}>
                        <h3>URL Components</h3>
                        <div className={styles.detailRow}><span>Protocol:</span> {urlDetails.protocol}</div>
                        <div className={styles.detailRow}><span>Host:</span> {urlDetails.host}</div>
                        <div className={styles.detailRow}><span>Path:</span> {urlDetails.pathname || '/'}</div>
                        {urlDetails.search && <div className={styles.detailRow}><span>Query:</span> {urlDetails.search}</div>}
                        {urlDetails.hash && <div className={styles.detailRow}><span>Hash:</span> {urlDetails.hash}</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
