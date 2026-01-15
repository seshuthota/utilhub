/**
 * Smart detection utility for identifying content types
 * Used by Command Palette to suggest relevant tools
 */

export function detectType(input) {
    if (!input) return null;
    const trimmed = input.trim();

    // JWT Token
    // Matches standard 3-part JWT structure (header.payload.signature)
    if (/^ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(trimmed)) {
        return {
            type: 'jwt',
            label: 'JWT Token Detected',
            toolId: 'jwt',
            toolPath: '/tools/jwt',
            paramKey: 'token'
        };
    }

    // JSON
    // Checks for valid JSON structure (object or array)
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            JSON.parse(trimmed);
            return {
                type: 'json',
                label: 'Valid JSON Detected',
                toolId: 'json',
                toolPath: '/tools/json',
                paramKey: 'code'
            };
        } catch {
            // Invalid JSON but looks like it might be
            return {
                type: 'json-repair',
                label: 'Possible JSON Detected',
                toolId: 'json',
                toolPath: '/tools/json',
                paramKey: 'code'
            };
        }
    }

    // Unix Timestamp
    // Matches 10 digits (seconds) or 13 digits (milliseconds)
    // Range sanity check: 1973 (100000000) to 2286 (9999999999)
    if (/^\d{10}$/.test(trimmed) || /^\d{13}$/.test(trimmed)) {
        return {
            type: 'timestamp',
            label: 'Unix Timestamp Detected',
            toolId: 'timestamp',
            toolPath: '/tools/timestamp',
            paramKey: 'ts'
        };
    }

    // SQL Query
    // Checks for common SQL keywords at start
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|TRUNCATE)\s/i.test(trimmed)) {
        return {
            type: 'sql',
            label: 'SQL Query Detected',
            toolId: 'sql',
            toolPath: '/tools/sql',
            paramKey: 'code'
        };
    }

    // Base64
    // Checks for valid Base64 characters and padding, length multiple of 4
    if (trimmed.length > 20 && /^[A-Za-z0-9+/]*={0,2}$/.test(trimmed) && trimmed.length % 4 === 0) {
        return {
            type: 'base64',
            label: 'Base64 String Detected',
            toolId: 'base64',
            toolPath: '/tools/base64',
            paramKey: 'input'
        };
    }

    // UUID
    // Standard UUID format verification
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
        return {
            type: 'uuid',
            label: 'UUID Detected',
            toolId: 'uuid',
            toolPath: '/tools/uuid',
            paramKey: 'uuid'
        };
    }

    // Color (Hex, RGB, HSL)
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ||
        /^rgb\(/.test(trimmed) ||
        /^hsl\(/.test(trimmed)) {
        return {
            type: 'color',
            label: 'Color Code Detected',
            toolId: 'color',
            toolPath: '/tools/color',
            paramKey: 'color'
        };
    }

    // URL
    if (/^(https?:\/\/)/i.test(trimmed)) {
        return {
            type: 'url',
            label: 'URL Detected',
            toolId: 'url',
            toolPath: '/tools/url',
            paramKey: 'url'
        };
    }

    // XML/HTML
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        return {
            type: 'xml',
            label: 'XML/HTML Detected',
            toolId: 'xml',
            toolPath: '/tools/xml',
            paramKey: 'code'
        };
    }

    // Cron Expression (5 or 6 parts)
    if (/^(\S+\s){4,5}\S+$/.test(trimmed)) {
        // Basic check, could be more strict
        return {
            type: 'cron',
            label: 'Cron Expression Detected',
            toolId: 'cron',
            toolPath: '/tools/cron',
            paramKey: 'cron'
        };
    }

    return null;
}
