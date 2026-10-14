import { describe, it, expect, vi, afterEach } from 'vitest';
import { compactResponseForHistory, sendRequest } from '@/utils/apiClientSend';
import { migrateRequestState } from '@/utils/apiClientRequest';
import { isPrivateAddress } from '@/utils/httpExactProxy';

const identity = (t) => t;
const request = migrateRequestState({ method: 'GET', url: 'https://api.test/x' });

afterEach(() => {
    vi.restoreAllMocks();
});

function mockFetch(impl) {
    global.fetch = vi.fn(impl);
    return global.fetch;
}

describe('sendRequest (browser mode)', () => {
    it('normalizes a JSON response', async () => {
        mockFetch(async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }));
        const { response, error } = await sendRequest(request, identity, 'browser');
        expect(error).toBeUndefined();
        expect(response).toEqual(expect.objectContaining({
            status: 200, data: { ok: true }, encoding: 'text', size: 11, transport: 'browser',
        }));
    });

    it('base64-encodes binary responses', async () => {
        mockFetch(async () => new Response(new Uint8Array([0, 1, 2, 255]), { status: 200, headers: { 'content-type': 'image/png' } }));
        const { response } = await sendRequest(request, identity, 'browser');
        expect(response.encoding).toBe('base64');
        expect(response.data).toBe('AAEC/w==');
    });

    it('explains CORS failures', async () => {
        mockFetch(async () => { throw new TypeError('Failed to fetch'); });
        const { response, error, rawError } = await sendRequest(request, identity, 'browser');
        expect(response).toBeUndefined();
        expect(rawError).toBe('Failed to fetch');
        expect(error).toMatch(/CORS/);
    });

    it('rethrows aborts so the caller can tell cancel from failure', async () => {
        mockFetch(async () => { throw new DOMException('Aborted', 'AbortError'); });
        await expect(sendRequest(request, identity, 'browser')).rejects.toThrow('Aborted');
    });
});

describe('sendRequest (proxy modes)', () => {
    it('posts the payload to the hosted proxy', async () => {
        const fetchMock = mockFetch(async () => ({
            status: 200,
            json: async () => ({ status: 204, statusText: 'No Content', headers: {}, data: '', time: 5 }),
        }));
        const { response } = await sendRequest(request, identity, 'proxy');
        expect(fetchMock.mock.calls[0][0]).toBe('/api/tester/proxy');
        expect(JSON.parse(fetchMock.mock.calls[0][1].body).url).toBe('https://api.test/x');
        expect(response.status).toBe(204);
    });

    it('returns proxy-level errors without a response', async () => {
        mockFetch(async () => ({ status: 403, json: async () => ({ error: 'Blocked request to private/internal address (10.0.0.1).' }) }));
        const { response, error } = await sendRequest(request, identity, 'proxy');
        expect(response).toBeUndefined();
        expect(error).toMatch(/Blocked/);
    });

    it('keeps the upstream response and adds a hint for header rejections', async () => {
        mockFetch(async () => ({
            status: 200,
            json: async () => ({ status: 400, statusText: 'Bad', headers: {}, data: 'header x-vercel-id not allowed', time: 1 }),
        }));
        const { response, error } = await sendRequest(request, identity, 'proxy');
        expect(response.status).toBe(400);
        expect(error).toMatch(/Local proxy/);
    });

    it('explains an unreachable local proxy', async () => {
        mockFetch(async () => { throw new TypeError('Failed to fetch'); });
        const { error } = await sendRequest(request, identity, 'local');
        expect(error).toMatch(/npm run proxy:local/);
    });
});

describe('compactResponseForHistory', () => {
    const base = { status: 200, statusText: 'OK', time: 1, headers: {} };

    it('drops binary bodies', () => {
        const out = compactResponseForHistory({ ...base, data: 'AAAA', encoding: 'base64' });
        expect(out).toEqual(expect.objectContaining({ data: '', encoding: 'text', truncated: true }));
    });

    it('truncates large text bodies and leaves small ones untouched', () => {
        const big = compactResponseForHistory({ ...base, data: { s: 'x'.repeat(70000) } });
        expect(big.truncated).toBe(true);
        expect(big.data.length).toBe(64 * 1024);
        const small = { ...base, data: { a: 1 } };
        expect(compactResponseForHistory(small)).toBe(small);
    });
});

describe('isPrivateAddress', () => {
    it('classifies private and public addresses', () => {
        ['127.0.0.1', '10.0.0.1', '172.31.255.255', '192.168.0.1', '169.254.169.254', '100.64.0.1', '0.0.0.0',
            '::1', 'fd12::1', 'fe80::1', '::ffff:192.168.1.1', '[::1]'].forEach((ip) =>
            expect(isPrivateAddress(ip), ip).toBe(true));
        ['8.8.8.8', '172.32.0.1', '1.1.1.1', '2606:4700::1111', 'example.com'].forEach((ip) =>
            expect(isPrivateAddress(ip), ip).toBe(false));
    });
});
