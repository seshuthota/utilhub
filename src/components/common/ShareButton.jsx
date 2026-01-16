'use client';

import { Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import styles from './ShareButton.module.css';

/**
 * A button that copies the current URL to the clipboard.
 *
 * @param {Object} props
 * @param {string} [props.title="Share"] - Button label text
 * @param {string} [props.className] - Additional classes
 * @param {Object} [props.style] - Inline styles
 */
export default function ShareButton({ title = "Share", className = '', style = {} }) {
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard', 'success');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleShare}
            title="Copy link to current state"
            className={`${styles.button} ${className}`}
            style={style}
        >
            {copied ? <Check size={16} className={styles.copied} /> : <LinkIcon size={16} />}
            {title}
        </button>
    );
}

