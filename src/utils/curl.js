/**
 * Parses a cURL command and extracts method, URL, headers, and body.
 * Supports common cURL flags: -X, -H, -d, --data, --data-raw, -u
 */
export function parseCurl(curlString) {
    if (!curlString || typeof curlString !== 'string') {
        return { error: 'Invalid cURL command' };
    }

    // Normalize: remove line continuations and extra whitespace
    const normalized = curlString
        .replace(/\\\n/g, ' ')
        .replace(/\\\r\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Check if it starts with curl
    if (!normalized.toLowerCase().startsWith('curl')) {
        return { error: 'Command must start with "curl"' };
    }

    let method = 'GET';
    let url = '';
    const headers = [];
    let body = '';
    let auth = { type: 'none' };

    // Regex patterns for different flags
    const patterns = {
        method: /-X\s+['"]?(\w+)['"]?/i,
        header: /-H\s+['"]([^'"]+)['"]/gi,
        data: /(?:-d|--data|--data-raw)\s+['"]([^'"]+)['"]/gi,
        basicAuth: /-u\s+['"]?([^:'"]+):([^'"]+)['"]?/i,
        url: /(?:curl\s+)?(?:[^'"]\s+)?['"]?(https?:\/\/[^\s'"]+)['"]?/i,
    };

    // Extract method
    const methodMatch = normalized.match(patterns.method);
    if (methodMatch) {
        method = methodMatch[1].toUpperCase();
    }

    // Extract URL - find the URL in the command
    // Look for URL patterns that aren't part of other flags
    const urlRegex = /['"]?(https?:\/\/[^\s'"]+)['"]?/g;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(normalized)) !== null) {
        url = urlMatch[1].replace(/['"]$/, '');
    }

    // If no URL found with http, try to find unquoted URL
    if (!url) {
        const parts = normalized.split(/\s+/);
        for (const part of parts) {
            if (part.startsWith('http://') || part.startsWith('https://')) {
                url = part.replace(/['"]$/, '').replace(/^['"]/, '');
                break;
            }
        }
    }

    // Extract headers
    const headerMatches = [...normalized.matchAll(/-H\s+['"]([^'"]+)['"]/gi)];
    for (const match of headerMatches) {
        const headerStr = match[1];
        const colonIndex = headerStr.indexOf(':');
        if (colonIndex > 0) {
            const key = headerStr.substring(0, colonIndex).trim();
            const value = headerStr.substring(colonIndex + 1).trim();
            headers.push({ key, value, active: true });
        }
    }

    // Extract body
    const dataMatches = [...normalized.matchAll(/(?:-d|--data|--data-raw)\s+['"]([^'"]+)['"]/gi)];
    if (dataMatches.length > 0) {
        body = dataMatches.map(m => m[1]).join('');
        // If there's a body and method is GET, change to POST
        if (method === 'GET' && body) {
            method = 'POST';
        }
    }

    // Also check for data without quotes
    if (!body) {
        const unquotedDataMatch = normalized.match(/(?:-d|--data|--data-raw)\s+(\S+)/i);
        if (unquotedDataMatch && !unquotedDataMatch[1].startsWith('-')) {
            body = unquotedDataMatch[1];
            if (method === 'GET') method = 'POST';
        }
    }

    // Extract basic auth
    const authMatch = normalized.match(/-u\s+['"]?([^:'\s]+):([^'\s]+)['"]?/i);
    if (authMatch) {
        auth = {
            type: 'basic',
            username: authMatch[1],
            password: authMatch[2]
        };
    }

    // Check for Bearer token in headers
    const authHeader = headers.find(h => h.key.toLowerCase() === 'authorization');
    if (authHeader) {
        const bearerMatch = authHeader.value.match(/^Bearer\s+(.+)$/i);
        if (bearerMatch) {
            auth = { type: 'bearer', token: bearerMatch[1] };
            // Remove auth header from headers list as it'll be added via auth settings
            const authIndex = headers.indexOf(authHeader);
            headers.splice(authIndex, 1);
        }
    }

    if (!url) {
        return { error: 'Could not find URL in cURL command' };
    }

    return {
        method,
        url,
        headers,
        body,
        auth
    };
}
