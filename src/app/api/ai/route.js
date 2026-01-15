import { NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';


export async function POST(request) {

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


    console.log(`[${new Date().toISOString()}] AI API Check: Key length=${apiKey.length}, Prefix=${apiKey.substring(0, 4)}***`);

    try {
        const { prompt, systemPrompt } = await request.json();

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
