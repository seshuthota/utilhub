import { describe, it, expect, beforeEach } from 'vitest';
import {
    decodeShareHash,
    encodeShareHash,
    exportHttpFile,
    exportPostman,
    exportUtilHub,
    importAny,
    redactForShare,
} from '@/utils/apiClientInterop';
import {
    COLLECTIONS_KEY,
    LEGACY_API_TESTER_KEY,
    loadCollections,
    mergeCollections,
    migrateCollections,
} from '@/utils/apiClientStore';
import { migrateRequestState } from '@/utils/apiClientRequest';

const postmanV21 = {
    info: { name: 'Shop API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
    auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{jwt}}' }] },
    variable: [{ key: 'baseUrl', value: 'https://shop.test' }],
    item: [
        { name: 'Health', request: { method: 'GET', url: '{{baseUrl}}/health' } },
        {
            name: 'Orders',
            item: [
                {
                    name: 'Create order',
                    request: {
                        method: 'POST',
                        header: [{ key: 'X-Trace', value: '1' }, { key: 'X-Off', value: '2', disabled: true }],
                        url: { raw: '{{baseUrl}}/orders?dry=true', host: ['{{baseUrl}}'], path: ['orders'] },
                        body: { mode: 'raw', raw: '{"sku":"a"}', options: { raw: { language: 'json' } } },
                    },
                },
                {
                    name: 'Admin',
                    item: [
                        {
                            name: 'Upload',
                            request: {
                                method: 'POST',
                                url: '{{baseUrl}}/upload',
                                auth: { type: 'apikey', apikey: [{ key: 'key', value: 'X-Key' }, { key: 'value', value: 'k' }, { key: 'in', value: 'query' }] },
                                body: { mode: 'formdata', formdata: [{ key: 'f', type: 'file', src: '/tmp/a.png' }, { key: 'n', value: 'x', type: 'text' }] },
                            },
                        },
                        {
                            name: 'GraphQL',
                            request: {
                                method: 'POST',
                                url: '{{baseUrl}}/graphql',
                                auth: { type: 'oauth2' },
                                body: { mode: 'graphql', graphql: { query: '{ me { id } }', variables: '{"a":1}' } },
                            },
                        },
                    ],
                },
            ],
        },
    ],
};

describe('Postman import', () => {
    it('maps nested folders, auth inheritance, bodies and collection variables', () => {
        const result = importAny(JSON.stringify(postmanV21));
        expect(result.source).toBe('postman-collection');
        expect(result.folders.map((f) => f.name)).toEqual(['Shop API', 'Shop API / Orders', 'Shop API / Orders / Admin']);
        expect(result.requests).toHaveLength(4);

        const byName = Object.fromEntries(result.requests.map((r) => [r.name, r]));
        expect(byName.Health.request.auth).toEqual(expect.objectContaining({ type: 'bearer', bearerToken: '{{jwt}}' }));

        const create = byName['Create order'].request;
        expect(create.url).toBe('{{baseUrl}}/orders?dry=true');
        expect(create.params).toEqual([{ key: 'dry', value: 'true', active: true }]);
        expect(create.bodyMode).toBe('json');
        expect(create.headers).toEqual([
            { key: 'X-Trace', value: '1', active: true },
            { key: 'X-Off', value: '2', active: false },
        ]);

        const upload = byName.Upload.request;
        expect(upload.auth).toEqual(expect.objectContaining({ type: 'apikey', apiKeyName: 'X-Key', apiKeyLocation: 'query' }));
        expect(upload.bodyMode).toBe('multipart');
        expect(upload.formFields[0]).toEqual(expect.objectContaining({ type: 'file', filename: 'a.png' }));

        const gql = byName.GraphQL.request;
        expect(gql.auth.type).toBe('none');
        expect(JSON.parse(gql.body)).toEqual({ query: '{ me { id } }', variables: { a: 1 } });

        expect(result.warnings.join(' ')).toMatch(/oauth2/);
        expect(result.warnings.join(' ')).toMatch(/File fields/);
        expect(result.environments[0].variables).toEqual([{ key: 'baseUrl', value: 'https://shop.test', enabled: true }]);
    });

    it('accepts v2.0 object-style auth', () => {
        const result = importAny(JSON.stringify({
            info: { name: 'Old', schema: 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json' },
            item: [{ name: 'r', request: { method: 'GET', url: 'https://x', auth: { type: 'basic', basic: { username: 'u', password: 'p' } } } }],
        }));
        expect(result.requests[0].request.auth).toEqual(
            expect.objectContaining({ type: 'basic', basicUsername: 'u', basicPassword: 'p' }),
        );
    });

    it('imports a Postman environment', () => {
        const result = importAny(JSON.stringify({
            name: 'Staging',
            _postman_variable_scope: 'environment',
            values: [{ key: 'host', value: 'stg', enabled: true }, { key: 'off', value: 'x', enabled: false }],
        }));
        expect(result.environments[0]).toEqual(expect.objectContaining({
            name: 'Staging',
            variables: [{ key: 'host', value: 'stg', enabled: true }, { key: 'off', value: 'x', enabled: false }],
        }));
    });

    it('rejects unknown and invalid input with a readable message', () => {
        expect(() => importAny('not json')).toThrow(/not valid JSON/);
        expect(() => importAny('{"hello":1}')).toThrow(/Unrecognized/);
        expect(() => importAny(JSON.stringify({ info: { schema: 'collection/v1' }, item: [] }))).toThrow(/v2/);
    });
});

describe('export round-trips', () => {
    const collections = migrateCollections({
        folders: [{ id: 'f1', name: 'Users' }],
        requests: [
            {
                id: 'r1', name: 'List', folderId: 'f1',
                request: migrateRequestState({ method: 'GET', url: '{{base}}/users', auth: { type: 'bearer', bearerToken: '{{jwt}}' } }),
            },
            {
                id: 'r2', name: 'Login', folderId: null,
                request: migrateRequestState({ method: 'POST', url: '{{base}}/login', bodyMode: 'urlencoded', formFields: [{ key: 'u', value: '{{user}}', type: 'text', active: true }] }),
            },
        ],
    });

    it('Postman export re-imports to the same requests', () => {
        const result = importAny(exportPostman(collections, 'Mine'));
        const byName = Object.fromEntries(result.requests.map((r) => [r.name, r.request]));
        expect(byName.List.url).toBe('{{base}}/users');
        expect(byName.List.auth).toEqual(expect.objectContaining({ type: 'bearer', bearerToken: '{{jwt}}' }));
        expect(byName.Login.bodyMode).toBe('urlencoded');
        expect(byName.Login.formFields[0]).toEqual(expect.objectContaining({ key: 'u', value: '{{user}}' }));
        expect(result.folders.map((f) => f.name)).toContain('Mine / Users');
    });

    it('UtilHub export re-imports folders, requests and environments', () => {
        const envs = [{ id: 'e', name: 'Dev', variables: [{ key: 'base', value: 'http://localhost', enabled: true }] }];
        const result = importAny(exportUtilHub(collections, envs));
        expect(result.source).toBe('utilhub');
        expect(result.folders).toEqual([{ id: 'f1', name: 'Users' }]);
        expect(result.requests.find((r) => r.name === 'List').folderId).toBe('f1');
        expect(result.environments[0].variables[0].value).toBe('http://localhost');
    });

    it('.http export keeps placeholders and auth', () => {
        const text = exportHttpFile(collections);
        expect(text).toContain('### Login\nPOST {{base}}/login');
        expect(text).toContain('u={{user}}');
        expect(text).toContain('### Users / List\nGET {{base}}/users\nAuthorization: Bearer {{jwt}}');
    });

    it('mergeCollections assigns fresh ids and remaps folders', () => {
        const merged = mergeCollections(collections, collections);
        expect(merged.requests).toHaveLength(4);
        expect(new Set(merged.requests.map((r) => r.id)).size).toBe(4);
        const copied = merged.requests.slice(2).find((r) => r.name === 'List');
        expect(copied.folderId).toBe(merged.folders[1].id);
    });
});

describe('share links', () => {
    it('removes literal secrets but keeps placeholders', () => {
        const request = migrateRequestState({
            url: 'https://h/x?api_key=LITERAL&page=2',
            headers: [
                { key: 'Authorization', value: 'Bearer abc', active: true },
                { key: 'X-Api-Key', value: '{{key}}', active: true },
                { key: 'Accept', value: 'application/json', active: true },
            ],
            auth: { type: 'basic', basicUsername: 'me', basicPassword: 'hunter2' },
        });
        const { request: safe, redacted } = redactForShare(request);
        expect(redacted).toBe(3);
        expect(safe.headers.map((h) => h.value)).toEqual(['', '{{key}}', 'application/json']);
        expect(safe.auth.basicPassword).toBe('');
        expect(safe.auth.basicUsername).toBe('me');
        expect(safe.url).toBe('https://h/x?api_key=&page=2');
    });

    it('round-trips through the URL hash (including unicode)', () => {
        const request = migrateRequestState({ method: 'PUT', url: 'https://h/ünï', bodyMode: 'raw', body: 'héllo ✓' });
        const { hash } = encodeShareHash(request);
        expect(hash).toMatch(/^#req=[A-Za-z0-9_-]+$/);
        const decoded = decodeShareHash(hash);
        expect(decoded.method).toBe('PUT');
        expect(decoded.body).toBe('héllo ✓');
        expect(decodeShareHash('#other=1')).toBeNull();
        expect(decodeShareHash('#req=!!!')).toBeNull();
    });
});

describe('collections storage', () => {
    beforeEach(() => localStorage.clear());

    it('migrates the v1 flat list', () => {
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify([{ id: 'a', name: 'Old', timestamp: 1, request: { url: 'https://x?q=1' } }]));
        localStorage.setItem('utilhub_api_collections_migrated', '1');
        const state = loadCollections();
        expect(state.schemaVersion).toBe(2);
        expect(state.folders).toEqual([]);
        expect(state.requests[0]).toEqual(expect.objectContaining({ id: 'a', folderId: null }));
        expect(state.requests[0].request.params).toEqual([{ key: 'q', value: '1', active: true }]);
    });

    it('imports retired API Tester collections once, as folders', () => {
        localStorage.setItem(LEGACY_API_TESTER_KEY, JSON.stringify([
            {
                id: 'c', name: 'Legacy',
                requests: [{ id: '1', name: 'Me', method: 'GET', url: 'https://x/me', headers: [], body: '', auth: { type: 'bearer', token: 't' } }],
            },
        ]));
        const first = loadCollections();
        expect(first.folders.map((f) => f.name)).toEqual(['Legacy']);
        expect(first.requests[0].request.auth).toEqual(expect.objectContaining({ type: 'bearer', bearerToken: 't' }));
        expect(first.requests[0].folderId).toBe(first.folders[0].id);

        const second = loadCollections();
        expect(second.requests).toHaveLength(1);
        expect(localStorage.getItem(LEGACY_API_TESTER_KEY)).not.toBeNull();
    });

    it('drops folder references that no longer exist', () => {
        const state = migrateCollections({ folders: [], requests: [{ id: 'r', name: 'x', folderId: 'gone', request: {} }] });
        expect(state.requests[0].folderId).toBeNull();
    });
});
