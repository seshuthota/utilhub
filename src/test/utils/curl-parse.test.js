import { describe, it, expect } from 'vitest';
import { parseCurl, isCurlCommand } from '@/utils/curl';
import { requestStateFromCurl } from '@/utils/apiClientRequest';

describe('isCurlCommand', () => {
    it('detects simple curl commands', () => {
        expect(isCurlCommand('curl https://example.com')).toBe(true);
        expect(isCurlCommand('  CURL https://example.com')).toBe(true);
        expect(isCurlCommand('curl')).toBe(true);
    });

    it('detects multi-line curl', () => {
        expect(isCurlCommand('curl https://example.com \\\n  -H "Accept: application/json"')).toBe(true);
        expect(isCurlCommand('\n\ncurl -X POST https://x.com')).toBe(true);
    });

    it('rejects plain URLs and empty input', () => {
        expect(isCurlCommand('https://example.com')).toBe(false);
        expect(isCurlCommand('')).toBe(false);
        expect(isCurlCommand(null)).toBe(false);
        expect(isCurlCommand('not curl stuff')).toBe(false);
        expect(isCurlCommand('curling is fun')).toBe(false);
    });
});

describe('parseCurl', () => {
    it('parses bearer auth and URL', () => {
        const r = parseCurl("curl https://api.example.com/data -H 'Authorization: Bearer xyz'");
        expect(r.error).toBeUndefined();
        expect(r.url).toBe('https://api.example.com/data');
        expect(r.auth.type).toBe('bearer');
        expect(r.auth.token).toBe('xyz');
    });

    it('parses JSON body with single quotes', () => {
        const r = parseCurl(`curl https://api.example.com/v1?q=1 -H 'Content-Type: application/json' -d '{"a":1}'`);
        expect(r.method).toBe('POST');
        expect(r.bodyMode).toBe('json');
        expect(r.body).toBe('{"a":1}');
        expect(r.params).toEqual([{ key: 'q', value: '1', active: true }]);
        expect(r.headers[0].key).toBe('Content-Type');
    });

    it('parses JSON body with escaped double quotes', () => {
        const r = parseCurl('curl https://api.example.com/v1 -d "{\\"a\\":1}"');
        expect(r.bodyMode).toBe('json');
        expect(r.body).toBe('{"a":1}');
    });

    it('parses multipart form fields', () => {
        const r = parseCurl('curl -X POST https://httpbin.org/post -F "name=test" -F "file=@photo.png"');
        expect(r.bodyMode).toBe('multipart');
        expect(r.formFields).toHaveLength(2);
        expect(r.formFields[1].type).toBe('file');
        expect(r.formFields[1].filename).toBe('photo.png');
    });

    it('parses data-urlencode as urlencoded mode', () => {
        const r = parseCurl('curl https://x.com --data-urlencode "user=a" --data-urlencode "pass=b"');
        expect(r.bodyMode).toBe('urlencoded');
        expect(r.formFields.map((f) => f.key)).toEqual(['user', 'pass']);
    });

    it('parses basic auth -u flag', () => {
        const r = parseCurl('curl -u admin:secret https://api.example.com/secure');
        expect(r.auth.type).toBe('basic');
        expect(r.auth.username).toBe('admin');
        expect(r.auth.password).toBe('secret');
    });

    it('parses method with -X', () => {
        const r = parseCurl('curl -X PUT https://api.example.com/item/1 -d \'{"n":1}\'');
        expect(r.method).toBe('PUT');
    });

    it('returns error for non-curl input', () => {
        const r = parseCurl('wget https://example.com');
        expect(r.error).toMatch(/must start with "curl"/i);
    });

    it('returns error when URL is missing', () => {
        const r = parseCurl('curl -H "Accept: json"');
        expect(r.error).toMatch(/Could not find URL/i);
    });
});

describe('requestStateFromCurl', () => {
    it('maps bearer token to RequestState.auth.bearerToken', () => {
        const { request, error } = requestStateFromCurl(
            "curl https://api.example.com/me -H 'Authorization: Bearer tok123'",
        );
        expect(error).toBeUndefined();
        expect(request.auth.type).toBe('bearer');
        expect(request.auth.bearerToken).toBe('tok123');
        expect(request.url).toBe('https://api.example.com/me');
        expect(request.method).toBe('GET');
    });

    it('maps basic auth fields', () => {
        const { request } = requestStateFromCurl('curl -u user:pass https://api.example.com');
        expect(request.auth.type).toBe('basic');
        expect(request.auth.basicUsername).toBe('user');
        expect(request.auth.basicPassword).toBe('pass');
    });

    it('maps JSON body mode and content-type header', () => {
        const { request } = requestStateFromCurl(
            `curl -X POST https://api.example.com/items -H 'Content-Type: application/json' -d '{"name":"x"}'`,
        );
        expect(request.bodyMode).toBe('json');
        expect(request.body).toBe('{"name":"x"}');
        expect(request.method).toBe('POST');
        expect(request.headers.some((h) => h.key === 'Content-Type')).toBe(true);
    });

    it('maps query params from URL', () => {
        const { request } = requestStateFromCurl('curl "https://api.example.com/search?q=hello&page=2"');
        expect(request.params).toEqual([
            { key: 'q', value: 'hello', active: true },
            { key: 'page', value: '2', active: true },
        ]);
    });

    it('maps multipart form fields', () => {
        const { request } = requestStateFromCurl(
            'curl -X POST https://api.example.com/upload -F "title=hi" -F "file=@doc.pdf"',
        );
        expect(request.bodyMode).toBe('multipart');
        expect(request.formFields).toHaveLength(2);
        expect(request.formFields[1].type).toBe('file');
        expect(request.formFields[1].filename).toBe('doc.pdf');
    });

    it('returns error for invalid curl', () => {
        const { request, error } = requestStateFromCurl('not a curl');
        expect(request).toBeUndefined();
        expect(error).toBeTruthy();
    });
});
