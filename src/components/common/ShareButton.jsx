'use client';

import { Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import styles from './ToolCard.module.css'; // Reuse generic button styles or create new ones? Reuse generic logic but inline style for now to be safe or use existing button class.

export default function ShareButton({ title = "Share" }) {
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard', 'success');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Reuse the button style from page modules if possible, but for now standard generic button
    return (
        <button
            onClick={handleShare}
            title="Copy link to current state"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.8rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: 'var(--foreground)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                fontWeight: 500
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
        >
            {copied ? <Check size={16} color="#4ade80" /> : <LinkIcon size={16} />}
            {title}
        </button>
    );
}
