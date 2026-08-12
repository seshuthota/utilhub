import { describe, it, expect } from 'vitest';
import { generateSnippets } from '@/utils/codeSnippets';

const base = {
    method: 'POST',
    url: 'https://api.example.com/items',
    params: [],
    headers: [{ key: 'Content-Type', value: 'application/json', active: true }],
    auth: { type: 'none' },
    bodyMode: 'json',
    body: '{"name":"test"}',
    formFields: [],
};

describe('generateSnippets', () => {
    it('generates valid-looking curl with body', () => {
        const { curl } = generateSnippets(base);
        expect(curl).toContain('curl -X POST');
        expect(curl).toContain('https://api.example.com/items');
        expect(curl).toContain("-d '{\"name\":\"test\"}'");
        expect(curl).toContain("Content-Type: application/json");
    });

    it('does not double-stringify JSON in fetch', () => {
        const { fetch } = generateSnippets(base);
        expect(fetch).toContain('body: "{\\"name\\":\\"test\\"}"');
        expect(fetch).not.toContain('JSON.stringify');
    });

    it('generates python requests with json payload', () => {
        const { python } = generateSnippets(base);
        expect(python).toContain('import requests');
        expect(python).toContain('requests.request("POST"');
        expect(python).toContain('json=payload');
        expect(python).toContain('payload = {"name":"test"}');
    });

    it('includes bearer auth header', () => {
        const { curl } = generateSnippets({
            ...base,
            auth: { type: 'bearer', bearerToken: 'abc' },
        });
        expect(curl).toContain('Authorization: Bearer abc');
    });

    it('generates urlencoded curl flags', () => {
        const { curl, python } = generateSnippets({
            ...base,
            bodyMode: 'urlencoded',
            body: '',
            headers: [],
            formFields: [
                { key: 'user', value: 'a', type: 'text', active: true },
                { key: 'pass', value: 'b', type: 'text', active: true },
            ],
        });
        expect(curl).toContain('--data-urlencode');
        expect(python).toContain('data = {');
    });
});
