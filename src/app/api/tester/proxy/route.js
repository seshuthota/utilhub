
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { url, method, headers, body } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Prepare options for the fetch request
        const options = {
            method: method || 'GET',
            headers: headers || {},
        };

        // Add body if method is not GET or HEAD
        if (method !== 'GET' && method !== 'HEAD' && body) {
            options.body = body;
        }

        const startTime = performance.now();
        const response = await fetch(url, options);
        const endTime = performance.now();

        // Get response body as text first
        const data = await response.text();

        // Try to parse as JSON if possible, otherwise return text
        let responseData = data;
        try {
            responseData = JSON.parse(data);
        } catch {
            // Keep as text if not JSON
        }

        // Extract headers
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            data: responseData,
            time: Math.round(endTime - startTime),
        });

    } catch (error) {
        return NextResponse.json({
            error: error.message,
            status: 500,
            statusText: 'Internal Server Error'
        }, { status: 500 });
    }
}
