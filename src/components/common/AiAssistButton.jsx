'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { generate, onProgressUpdate, isWebGPUSupported, isEngineReady } from '@/lib/webllm';
import { useToast } from '@/components/Toast';

export default function AiAssistButton({ prompt, systemPrompt, onResult, disabled = false }) {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [supported, setSupported] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        setSupported(isWebGPUSupported());
        const unsubscribe = onProgressUpdate(setProgress);
        return unsubscribe;
    }, []);

    const handleClick = async () => {
        if (!supported) {
            showToast('WebGPU not supported in this browser', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await generate(prompt, systemPrompt);
            onResult(result);
            showToast('AI response generated!', 'success');
        } catch (error) {
            console.error('AI generation error:', error);
            showToast('AI generation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!supported) {
        return (
            <button
                disabled
                title="WebGPU required (Chrome 113+)"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem 0.8rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    cursor: 'not-allowed',
                    fontSize: '0.85rem',
                }}
            >
                <AlertCircle size={16} />
                AI (WebGPU needed)
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={disabled || loading}
            title={loading && progress < 100 ? `Loading model: ${progress}%` : 'AI Assist'}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.8rem',
                background: loading ? 'rgba(147, 51, 234, 0.2)' : 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(79, 70, 229, 0.3))',
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
                    <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    {progress < 100 ? `${progress}%` : 'Thinking...'}
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
