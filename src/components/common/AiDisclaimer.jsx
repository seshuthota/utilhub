'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import styles from './AiDisclaimer.module.css';

const STORAGE_KEY = 'utilhub_ai_disclaimer_accepted';

/**
 * AiDisclaimer - Modal warning users before AI features send data externally
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onAccept - Called when user accepts
 * @param {Function} props.onCancel - Called when user cancels
 */
export default function AiDisclaimer({ isOpen, onAccept, onCancel }) {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        // Trap focus in modal when open
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleAccept = () => {
        if (dontShowAgain) {
            try {
                localStorage.setItem(STORAGE_KEY, 'true');
            } catch (e) {
                console.warn('Could not save AI disclaimer preference:', e);
            }
        }
        onAccept();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={styles.overlay}
            onClick={onCancel}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-disclaimer-title"
        >
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className={styles.closeBtn}
                    onClick={onCancel}
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                <div className={styles.iconWrapper}>
                    <AlertTriangle size={32} />
                </div>

                <h2 id="ai-disclaimer-title" className={styles.title}>
                    AI Data Notice
                </h2>

                <div className={styles.content}>
                    <p>
                        This action uses <strong>AI-powered features</strong> that send your data
                        to our AI provider (<strong>Groq</strong>) for processing.
                    </p>

                    <div className={styles.infoBox}>
                        <p><strong>What happens:</strong></p>
                        <ul>
                            <li>Your input is securely transmitted to Groq&apos;s API</li>
                            <li>The AI processes your request and returns results</li>
                            <li>Data is not stored by UtilHub after processing</li>
                        </ul>
                    </div>

                    <p className={styles.note}>
                        Standard formatting and tool features remain <strong>100% local</strong> —
                        only AI-specific actions require external processing.
                    </p>
                </div>

                <label className={styles.checkbox}>
                    <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                    />
                    <span>Don&apos;t show this again</span>
                </label>

                <div className={styles.actions}>
                    <button
                        className={styles.cancelBtn}
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.acceptBtn}
                        onClick={handleAccept}
                        autoFocus
                    >
                        I Understand, Proceed
                    </button>
                </div>

                <a
                    href="https://groq.com/privacy-policy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.privacyLink}
                >
                    Groq Privacy Policy <ExternalLink size={12} />
                </a>
            </div>
        </div>
    );
}

/**
 * Check if user has previously accepted the AI disclaimer
 */
export function hasAcceptedAiDisclaimer() {
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

/**
 * Reset the AI disclaimer preference
 */
export function resetAiDisclaimer() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.warn('Could not reset AI disclaimer preference:', e);
    }
}
