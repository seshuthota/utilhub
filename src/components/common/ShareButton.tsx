'use client';

import { Link as LinkIcon, Check } from 'lucide-react';
import { useState, CSSProperties } from 'react';
import { useToast } from '@/components/Toast';
import styles from './ShareButton.module.css';

interface ShareButtonProps {
    title?: string;
    className?: string;
    style?: CSSProperties;
}

/**
 * A button that copies the current URL to the clipboard.
 */
export default function ShareButton({
    title = "Share",
    className = '',
    style = {}
}: ShareButtonProps) {
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
