'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { generate } from '@/lib/ai';
import { useToast } from '@/components/Toast';

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
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.8rem',
                background: loading
                    ? 'rgba(147, 51, 234, 0.2)'
                    : 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(79, 70, 229, 0.3))',
                border: '1px solid rgba(147, 51, 234, 0.4)',
                borderRadius: '6px',
                color: '#fff',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s',
            }}
        >
            {loading ? (
                <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
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
