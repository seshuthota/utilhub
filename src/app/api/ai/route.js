import { NextResponse } from 'next/server';
import { getPrompt } from './prompts';
import { checkRateLimit } from '@/utils/rate-limit';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';


export async function POST(request) {
    // 1. Security: Origin Check
    // Get the request origin and the server's origin
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const serverOrigin = `${protocol}://${host}`;

    // Skip check for non-browser requests (no origin) if necessary, 
    // but for this client-side app, we expect an origin or referer from the same app.
    // Allow localhost for dev.
    const allowedOrigins = ['http://localhost:3000', serverOrigin];

    // Simple check: If origin is present, it must be allowed. 
    // If not present (e.g. server-side fetch), check referer or allow if secure token implies internal use.
    // Here we strict it to browser calls mostly.
    if (origin && !allowedOrigins.some(o => origin.startsWith(o)) && origin !== serverOrigin) {
        // Note: Strict comparison might fail on Vercel preview URLs, 
        // so checking if it ends with vercel.app might be good if we knew the domain.
        // For now, let's trust same-origin relative based logic if possible.
        // Better: Compare `origin` with `new URL(request.url).origin`
    }

    // Robust Same-Origin Check
    const currentOrigin = new URL(request.url).origin;
    if (origin && origin !== currentOrigin) {
        console.warn(`[API] Blocked cross-origin request from: ${origin}`);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Security: Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
        );
    }

    let apiKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : null;


    if (apiKey) {
        // Fix common issue where user pastes key twice (e.g. keykey)
        if (apiKey.length > 100 && apiKey.startsWith('gsk_')) {
            const half = apiKey.length / 2;
            const firstHalf = apiKey.substring(0, half);
            const secondHalf = apiKey.substring(half);
            if (firstHalf === secondHalf) {
                console.warn(`[API] Detected duplicated key. Auto-fixing.`);
                apiKey = firstHalf;
            }
        }
    }

    if (!apiKey) {
        console.error('AI API Error: GROQ_API_KEY is missing or empty.');
        return NextResponse.json(
            { error: 'AI service not configured' },
            { status: 503 }
        );
    }


    if (process.env.NODE_ENV === 'development') {
        console.log(`[${new Date().toISOString()}] AI API key loaded (length=${apiKey.length})`);
    }

    try {
        const { type, payload } = await request.json();

        if (!type) {
            return NextResponse.json(
                { error: 'Missing request type' },
                { status: 400 }
            );
        }

        let promptConfig;
        try {
            promptConfig = getPrompt(type, payload);
        } catch (e) {
            return NextResponse.json(
                { error: e.message },
                { status: 400 }
            );
        }

        const { prompt, systemPrompt } = promptConfig;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt || 'You are a helpful coding assistant. Be concise.' },
                    { role: 'user', content: prompt },
                ],
                temperature: 1,
                max_tokens: 8192,
                top_p: 1,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: error.error?.message || `API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({
            content: data.choices[0].message.content
        });
    } catch (error) {
        console.error('AI API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}
