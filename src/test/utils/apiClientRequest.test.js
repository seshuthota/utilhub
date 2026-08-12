import { describe, it, expect } from 'vitest';
import {
    buildProxyPayload,
    migrateRequestState,
    stripFilePayloads,
    parseParamsFromUrl,
    applyBodyModeContentType,
    formatBytes,
    looksLikeJson,
    requestStateFromCurl,
    buildUrl,
} from '@/utils/apiClientRequest';

const identity = (t) => t;

describe('apiClientRequest', () => {
    it('migrates legacy requests without bodyMode', () => {
        const migrated = migrateRequestState({
            method: 'POST',
            url: 'https://example.com',
            headers: [],
            auth: { type: 'none' },
            body: '{"a":1}',
        });
        expect(migrated.bodyMode).toBe('json');
        expect(migrated.formFields).toEqual([]);
    });

    it('migrates empty body to none', () => {
        const migrated = migrateRequestState({ method: 'GET', url: 'https://x.com', body: '' });
        expect(migrated.bodyMode).toBe('none');
    });

    it('parses params from URL', () => {
        const params = parseParamsFromUrl('https://api.test/path?foo=bar&x=1');
        expect(params).toEqual([
            { key: 'foo', value: 'bar', active: true },
            { key: 'x', value: '1', active: true },
        ]);
    });

    it('strips file base64 from form fields', () => {
        const stripped = stripFilePayloads({
            method: 'POST',
            url: 'https://x.com',
            params: [],
            headers: [],
            auth: { type: 'none' },
            bodyMode: 'multipart',
            body: '',
            formFields: [
                {
                    key: 'file',
                    value: 'a.png',
                    type: 'file',
                    active: true,
                    filename: 'a.png',
                    contentBase64: 'AAAA',
                },
            ],
        });
        expect(stripped.formFields[0].contentBase64).toBeUndefined();
        expect(stripped.formFields[0].filename).toBe('a.png');
    });

    it('builds bearer auth headers', () => {
        const payload = buildProxyPayload(
            {
                method: 'GET',
                url: 'https://api.example.com/data',
                params: [],
                headers: [],
                auth: { type: 'bearer', bearerToken: 'tok123' },
                bodyMode: 'none',
                body: '',
                formFields: [],
            },
            identity,
        );
        expect(payload.headers.Authorization).toBe('Bearer tok123');
        expect(payload.body).toBeUndefined();
    });

    it('injects API key into query string', () => {
        const payload = buildProxyPayload(
            {
                method: 'GET',
                url: 'https://api.example.com/data',
                params: [],
                headers: [],
                auth: {
                    type: 'apikey',
                    apiKeyName: 'key',
                    apiKeyValue: 'secret',
                    apiKeyLocation: 'query',
                },
                bodyMode: 'none',
                body: '',
                formFields: [],
            },
            identity,
        );
        expect(payload.url).toContain('key=secret');
        expect(payload.headers.key).toBeUndefined();
    });

    it('injects API key into header', () => {
        const payload = buildProxyPayload(
            {
                method: 'GET',
                url: 'https://api.example.com/data',
                params: [],
                headers: [],
                auth: {
                    type: 'apikey',
                    apiKeyName: 'X-API-Key',
                    apiKeyValue: 'secret',
                    apiKeyLocation: 'header',
                },
                bodyMode: 'none',
                body: '',
                formFields: [],
            },
            identity,
        );
        expect(payload.headers['X-API-Key']).toBe('secret');
    });

    it('omits body for none mode', () => {
        const payload = buildProxyPayload(
            {
                method: 'POST',
                url: 'https://api.example.com',
                params: [],
                headers: [],
                auth: { type: 'none' },
                bodyMode: 'none',
                body: '{"x":1}',
                formFields: [],
            },
            identity,
        );
        expect(payload.body).toBeUndefined();
        expect(payload.formFields).toBeUndefined();
    });

    it('sends json body', () => {
        const payload = buildProxyPayload(
            {
                method: 'POST',
                url: 'https://api.example.com',
                params: [],
                headers: [{ key: 'Content-Type', value: 'application/json', active: true }],
                auth: { type: 'none' },
                bodyMode: 'json',
                body: '{"x":1}',
                formFields: [],
            },
            identity,
        );
        expect(payload.body).toBe('{"x":1}');
        expect(payload.bodyMode).toBe('json');
    });

    it('sends urlencoded form fields', () => {
        const payload = buildProxyPayload(
            {
                method: 'POST',
                url: 'https://api.example.com',
                params: [],
                headers: [],
                auth: { type: 'none' },
                bodyMode: 'urlencoded',
                body: '',
                formFields: [
                    { key: 'user', value: 'a', type: 'text', active: true },
                    { key: 'pass', value: 'b', type: 'text', active: true },
                ],
            },
            identity,
        );
        expect(payload.formFields).toHaveLength(2);
        expect(payload.bodyMode).toBe('urlencoded');
    });

    it('strips content-type for multipart and includes file field', () => {
        const payload = buildProxyPayload(
            {
                method: 'POST',
                url: 'https://api.example.com/upload',
                params: [],
                headers: [{ key: 'Content-Type', value: 'multipart/form-data', active: true }],
                auth: { type: 'none' },
                bodyMode: 'multipart',
                body: '',
                formFields: [
                    {
                        key: 'file',
                        value: 'x.png',
                        type: 'file',
                        active: true,
                        filename: 'x.png',
                        contentBase64: 'AAAA',
                        contentType: 'image/png',
                    },
                ],
            },
            identity,
        );
        expect(payload.headers['Content-Type']).toBeUndefined();
        expect(payload.formFields[0].contentBase64).toBe('AAAA');
    });

    it('resolves env vars in URL and headers', () => {
        const resolve = (t) => t.replace('{{base}}', 'https://api.test').replace('{{tok}}', 'abc');
        const payload = buildProxyPayload(
            {
                method: 'GET',
                url: '{{base}}/v1',
                params: [],
                headers: [{ key: 'Authorization', value: 'Bearer {{tok}}', active: true }],
                auth: { type: 'none' },
                bodyMode: 'none',
                body: '',
                formFields: [],
            },
            resolve,
        );
        expect(payload.url).toBe('https://api.test/v1');
        expect(payload.headers.Authorization).toBe('Bearer abc');
    });

    it('does not inject content-type for json body mode', () => {
        const headers = applyBodyModeContentType([], 'json');
        expect(headers).toEqual([]);
    });

    it('preserves user headers when switching to json', () => {
        const headers = applyBodyModeContentType(
            [{ key: 'X-Custom', value: '1', active: true }],
            'json',
        );
        expect(headers).toEqual([{ key: 'X-Custom', value: '1', active: true }]);
    });

    it('removes content-type for multipart', () => {
        const headers = applyBodyModeContentType(
            [{ key: 'Content-Type', value: 'application/json', active: true }],
            'multipart',
        );
        expect(headers.find((h) => h.key.toLowerCase() === 'content-type')).toBeUndefined();
    });

    it('formats bytes', () => {
        expect(formatBytes(500)).toBe('500 B');
        expect(formatBytes(2048)).toBe('2.0 KB');
    });

    it('detects json', () => {
        expect(looksLikeJson('{"a":1}')).toBe(true);
        expect(looksLikeJson('hello')).toBe(false);
    });

    it('builds URL from base and params', () => {
        expect(
            buildUrl('https://api.test/path?old=1', [
                { key: 'a', value: '1', active: true },
                { key: 'b', value: '2', active: false },
            ]),
        ).toBe('https://api.test/path?a=1');
    });

    it('requestStateFromCurl integrates parse + migrate', () => {
        const { request, error } = requestStateFromCurl(
            "curl -X POST https://z.com/x -H 'Authorization: Bearer t' -d '{\"ok\":true}'",
        );
        expect(error).toBeUndefined();
        expect(request.method).toBe('POST');
        expect(request.auth.bearerToken).toBe('t');
        expect(request.bodyMode).toBe('json');
    });
});
