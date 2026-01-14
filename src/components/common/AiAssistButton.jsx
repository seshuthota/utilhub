'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { generate } from '@/lib/ai';
import { useToast } from '@/components/Toast';
import styles from './AiAssistButton.module.css';

export default function AiAssistButton({ prompt, systemPrompt, onResult, disabled = false }) {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleClick = async () => {
        setLoading(true);
        try {
            const result = await generate(prompt, systemPrompt);
            onResult(result);
            showToast('AI response generated!', 'success');
        } catch (error) {
            console.error('AI generation error:', error);
            showToast(error.message || 'AI generation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || loading}
            title="AI Assist (Groq)"
            className={`${styles.button} ${loading ? styles.loading : ''}`}
        >
            {loading ? (
                <>
                    <Loader2 size={16} className={styles.spinner} />
                    Thinking...
                </>
            ) : (
                <>
                    <Sparkles size={16} />
                    AI Assist
                </>
            )}
        </button>
    );
}

