'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { generate } from '@/lib/ai';
import { useToast } from '@/components/Toast';
import AiDisclaimer, { hasAcceptedAiDisclaimer } from './AiDisclaimer';
import styles from './AiAssistButton.module.css';

export default function AiAssistButton({ type, payload, onResult, disabled = false }) {
    const [loading, setLoading] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const { showToast } = useToast();

    const executeAiRequest = useCallback(async () => {
        setLoading(true);
        try {
            const result = await generate(type, payload);
            onResult(result);
            showToast('AI response generated!', 'success');
        } catch (error) {
            console.error('AI generation error:', error);
            showToast(error.message || 'AI generation failed', 'error');
        } finally {
            setLoading(false);
        }
    }, [type, payload, onResult, showToast]);

    const handleClick = async () => {
        // Check if user has already accepted the disclaimer
        if (hasAcceptedAiDisclaimer()) {
            await executeAiRequest();
        } else {
            setShowDisclaimer(true);
        }
    };

    const handleDisclaimerAccept = async () => {
        setShowDisclaimer(false);
        await executeAiRequest();
    };

    const handleDisclaimerCancel = () => {
        setShowDisclaimer(false);
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={disabled || loading}
                title="AI Assist (Groq)"
                aria-label="Generate with AI assistance"
                className={`${styles.button} ${loading ? styles.loading : ''}`}
            >
                {loading ? (
                    <>
                        <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
                        Thinking...
                    </>
                ) : (
                    <>
                        <Sparkles size={16} aria-hidden="true" />
                        AI Assist
                    </>
                )}
            </button>

            <AiDisclaimer
                isOpen={showDisclaimer}
                onAccept={handleDisclaimerAccept}
                onCancel={handleDisclaimerCancel}
            />
        </>
    );
}
