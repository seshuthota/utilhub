export function sanitizeHtml(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/\s+href\s*=\s*"javascript:[^"]*"/gi, '')
        .replace(/\s+href\s*=\s*'javascript:[^']*'/gi, '')
        .replace(/\s+src\s*=\s*"javascript:[^"]*"/gi, '')
        .replace(/\s+src\s*=\s*'javascript:[^']*'/gi, '');
}
