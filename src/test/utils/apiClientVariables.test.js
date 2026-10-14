import { describe, it, expect } from 'vitest';
import {
    buildFinalUrl,
    buildUrl,
    findUnresolvedVariables,
    isSensitiveHeader,
    isTemplateOnly,
    migrateRequestState,
    resolveUrl,
} from '@/utils/apiClientRequest';
import { substituteVariables } from '@/hooks/useEnvironments';

const vars = [
    { key: 'base', value: 'https://api.example.com/v1', enabled: true },
    { key: 'token', value: 'a b&c=d', enabled: true },
    { key: 'off', value: 'nope', enabled: false },
];
const resolve = (t) => substituteVariables(t, vars);

describe('substituteVariables', () => {
    it('replaces known enabled variables and leaves unknown ones', () => {
        expect(substituteVariables('{{base}}/x?{{off}}&{{missing}}', vars))
            .toBe('https://api.example.com/v1/x?{{off}}&{{missing}}');
    });

    it('is single-pass: a value containing {{other}} is not expanded again', () => {
        const v = [
            { key: 'a', value: '{{b}}', enabled: true },
            { key: 'b', value: 'B', enabled: true },
        ];
        expect(substituteVariables('{{a}}-{{b}}', v)).toBe('{{b}}-B');
    });

    it('tolerates whitespace inside braces and uses the first duplicate', () => {
        const v = [
            { key: 'x', value: '1', enabled: true },
            { key: 'x', value: '2', enabled: true },
        ];
        expect(substituteVariables('{{ x }}', v)).toBe('1');
    });
});

describe('query-string variables', () => {
    it('buildUrl keeps {{var}} placeholders unencoded', () => {
        const url = buildUrl('https://h/p', [{ key: 'q', value: 'hi {{token}}!', active: true }]);
        expect(url).toBe('https://h/p?q=hi%20{{token}}!');
        expect(url).toContain('{{token}}');
    });

    it('resolves params-table variables and URL-encodes their values', () => {
        const params = [{ key: 'auth', value: '{{token}}', active: true }];
        const request = migrateRequestState({ url: buildUrl('{{base}}/items', params), params });
        expect(buildFinalUrl(request, resolve)).toBe(
            'https://api.example.com/v1/items?auth=a%20b%26c%3Dd',
        );
    });

    it('repairs URLs saved with percent-encoded placeholders', () => {
        expect(resolveUrl('https://h/p?t=%7B%7Btoken%7D%7D', resolve)).toBe('https://h/p?t=a%20b%26c%3Dd');
    });

    it('does not encode variables in the path/host part', () => {
        expect(resolveUrl('{{base}}/users', resolve)).toBe('https://api.example.com/v1/users');
    });
});

describe('findUnresolvedVariables', () => {
    it('reports variables missing from the environment across url, headers, auth and body', () => {
        const request = migrateRequestState({
            method: 'POST',
            url: '{{base}}/x?id={{userId}}',
            headers: [
                { key: 'X-Trace', value: '{{traceId}}', active: true },
                { key: 'X-Off', value: '{{ignored}}', active: false },
            ],
            auth: { type: 'bearer', bearerToken: '{{jwt}}' },
            bodyMode: 'json',
            body: '{"t":"{{token}}","o":"{{other}}"}',
        });
        expect(findUnresolvedVariables(request, resolve).sort()).toEqual(
            ['jwt', 'other', 'traceId', 'userId'],
        );
    });

    it('finds nothing when everything resolves', () => {
        const request = migrateRequestState({ url: '{{base}}/ok' });
        expect(findUnresolvedVariables(request, resolve)).toEqual([]);
    });
});

describe('secret helpers', () => {
    it('flags sensitive header names', () => {
        ['Authorization', 'Cookie', 'X-API-Key', 'x-access-token', 'Client-Secret'].forEach((h) =>
            expect(isSensitiveHeader(h)).toBe(true),
        );
        ['Content-Type', 'Accept', 'X-Request-Id'].forEach((h) => expect(isSensitiveHeader(h)).toBe(false));
    });

    it('treats placeholder-only values as safe', () => {
        expect(isTemplateOnly('{{token}}')).toBe(true);
        expect(isTemplateOnly(' {{a}}{{b}} ')).toBe(true);
        expect(isTemplateOnly('Bearer {{token}}')).toBe(false);
        expect(isTemplateOnly('abc123')).toBe(false);
    });
});
