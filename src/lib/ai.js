'use client';

// Groq API integration for AI assistance
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile'; // Fast and capable

let apiKey = null;

export function setApiKey(key) {
    apiKey = key;
    if (typeof window !== 'undefined') {
        localStorage.setItem('utilhub-groq-key', key);
    }
}

export function getApiKey() {
    if (apiKey) return apiKey;
    // Check localStorage first
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('utilhub-groq-key');
        if (stored) {
            apiKey = stored;
            return apiKey;
        }
    }
    // Check environment variable (must be NEXT_PUBLIC_ prefixed for client-side)
    if (process.env.NEXT_PUBLIC_GROQ_API_KEY) {
        apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
        return apiKey;
    }
    return null;
}

export function isConfigured() {
    return !!getApiKey();
}

export async function generate(prompt, systemPrompt = 'You are a helpful coding assistant. Be concise.') {
    const key = getApiKey();
    if (!key) {
        throw new Error('Groq API key not configured. Add it in Settings.');
    }

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 256,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
