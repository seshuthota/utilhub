'use client';

// AI module - calls server-side API route (keeps API key secure)

export async function generate(type, payload = {}) {
    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, payload }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
}

export function isConfigured() {
    // Server handles config - always return true for UI purposes
    // Errors will be handled when the request is made
    return true;
}
