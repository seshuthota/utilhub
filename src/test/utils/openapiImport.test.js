import { describe, it, expect } from 'vitest';
import { importAny } from '@/utils/apiClientInterop';
import { isOpenApiSpec } from '@/utils/openapiImport';

const petstore = {
    openapi: '3.0.3',
    info: { title: 'Petstore', version: '1.0.0' },
    servers: [
        {
            url: 'https://{region}.petstore.test/v1',
            description: 'Prod',
            variables: { region: { default: 'eu', enum: ['eu', 'us'] } },
        },
    ],
    security: [{ bearerAuth: [] }],
    paths: {
        '/pets': {
            get: {
                tags: ['pets'],
                summary: 'List pets',
                parameters: [
                    { name: 'limit', in: 'query', schema: { type: 'integer', example: 20 } },
                    { name: 'filter', in: 'query', required: true, schema: { type: 'string' } },
                    { name: 'X-Trace', in: 'header', required: true, schema: { type: 'string' } },
                    { name: 'session', in: 'cookie', schema: { type: 'string' } },
                ],
            },
            post: {
                tags: ['pets'],
                operationId: 'createPet',
                requestBody: {
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
                },
            },
        },
        '/pets/{petId}': {
            parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
            get: { tags: ['pets'], summary: 'Get pet', security: [] },
        },
        '/health': { get: { summary: 'Health' } },
    },
    components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
        schemas: {
            Pet: {
                type: 'object',
                required: ['name'],
                properties: {
                    id: { type: 'integer', readOnly: true },
                    name: { type: 'string', example: 'Rex' },
                    tag: { type: 'string' },
                    parent: { $ref: '#/components/schemas/Pet' },
                    birthday: { type: 'string', format: 'date' },
                },
            },
        },
    },
};

describe('OpenAPI 3 import', () => {
    it('maps tags to folders, operations to requests and servers to an environment', () => {
        const result = importAny(JSON.stringify(petstore));

        expect(result.source).toBe('openapi');
        expect(result.folders.map((f) => f.name)).toEqual(['Petstore / pets', 'Petstore / health']);
        expect(result.requests.map((r) => r.name)).toEqual(['List pets', 'createPet', 'Get pet', 'Health']);
        expect(result.requests.map((r) => r.folderId)).toEqual([
            result.folders[0].id,
            result.folders[0].id,
            result.folders[0].id,
            result.folders[1].id,
        ]);
        expect(result.environments).toHaveLength(1);
        expect(result.environments[0].name).toBe('Petstore');
        expect(result.environments[0].variables).toEqual([
            { key: 'baseUrl', value: 'https://eu.petstore.test/v1', enabled: true },
        ]);
        expect(result.note).toContain('OpenAPI 3.0.3');
    });

    it('builds query/header params, path placeholders and auth from the global requirement', () => {
        const result = importAny(JSON.stringify(petstore));
        const list = result.requests.find((r) => r.name === 'List pets').request;

        expect(list.method).toBe('GET');
        // Optional query params are imported unchecked, so they stay out of the URL until enabled.
        expect(list.url).toBe('{{baseUrl}}/pets?filter={{filter}}');
        expect(list.params).toEqual([
            { key: 'limit', value: '20', active: false },
            { key: 'filter', value: '{{filter}}', active: true },
        ]);
        expect(list.headers).toEqual([{ key: 'X-Trace', value: '{{X-Trace}}', active: true }]);
        expect(list.auth).toEqual(expect.objectContaining({ type: 'bearer', bearerToken: '{{token}}' }));
        expect(result.warnings.join(' ')).toMatch(/Cookie parameters/);
    });

    it('generates a JSON body from $ref schemas without looping on recursion', () => {
        const result = importAny(JSON.stringify(petstore));
        const create = result.requests.find((r) => r.name === 'createPet').request;

        expect(create.bodyMode).toBe('json');
        expect(create.headers).toContainEqual({
            key: 'Content-Type',
            value: 'application/json',
            active: true,
        });
        const body = JSON.parse(create.body);
        expect(body).not.toHaveProperty('id'); // readOnly stays with the server
        expect(body).toMatchObject({ name: 'Rex', tag: 'string', birthday: '2024-01-01' });
        // A self-reference is expanded once, then cut to stop the recursion.
        expect(body.parent).toEqual({});
    });

    it('uses path-level parameters and honors security: [] as public', () => {
        const result = importAny(JSON.stringify(petstore));
        const get = result.requests.find((r) => r.name === 'Get pet').request;

        expect(get.url).toBe('{{baseUrl}}/pets/{{petId}}');
        expect(get.auth.type).toBe('none');
    });

    it('accepts YAML specs', () => {
        const text = `openapi: 3.1.0
info:
  title: YAML API
paths:
  /ping:
    get:
      summary: Ping
`;
        const result = importAny(text);
        expect(result.source).toBe('openapi');
        expect(result.requests.map((r) => r.name)).toEqual(['Ping']);
        expect(result.folders.map((f) => f.name)).toEqual(['YAML API / ping']);
        expect(result.environments[0].variables[0]).toEqual({
            key: 'baseUrl',
            value: 'http://localhost',
            enabled: true,
        });
        expect(result.warnings.join(' ')).toMatch(/no servers/i);
        expect(result.note).toContain('OpenAPI 3.1.0');
    });
});

describe('Swagger 2.0 import', () => {
    const legacy = {
        swagger: '2.0',
        info: { title: 'Legacy' },
        host: 'api.legacy.test',
        basePath: '/v2',
        schemes: ['http'],
        consumes: ['multipart/form-data'],
        securityDefinitions: {
            basicAuth: { type: 'basic' },
            keyAuth: { type: 'apiKey', name: 'X-Key', in: 'header' },
        },
        security: [{ basicAuth: [] }],
        paths: {
            '/upload': {
                post: {
                    operationId: 'uploadFile',
                    consumes: ['multipart/form-data'],
                    parameters: [
                        { name: 'file', in: 'formData', type: 'file', required: true },
                        { name: 'note', in: 'formData', type: 'string' },
                    ],
                },
            },
            '/items': {
                post: {
                    parameters: [
                        {
                            name: 'body',
                            in: 'body',
                            schema: { type: 'object', properties: { a: { type: 'string' } } },
                        },
                    ],
                    security: [{ keyAuth: [] }],
                },
            },
        },
    };

    it('derives the base URL from scheme + host + basePath', () => {
        const result = importAny(JSON.stringify(legacy));
        expect(result.environments[0].variables[0].value).toBe('http://api.legacy.test/v2');
        expect(result.folders.map((f) => f.name)).toEqual(['Legacy / upload', 'Legacy / items']);
        expect(result.note).toContain('Swagger 2.0');
    });

    it('maps formData parameters and body parameters', () => {
        const result = importAny(JSON.stringify(legacy));
        const byName = Object.fromEntries(result.requests.map((r) => [r.name, r.request]));

        const upload = byName.uploadFile;
        expect(upload.bodyMode).toBe('multipart');
        expect(upload.formFields.map((f) => [f.key, f.type])).toEqual([
            ['file', 'file'],
            ['note', 'text'],
        ]);
        expect(upload.auth).toEqual(expect.objectContaining({ type: 'basic', basicUsername: '{{username}}' }));

        const items = byName['POST /items'];
        expect(items.bodyMode).toBe('json');
        expect(JSON.parse(items.body)).toEqual({ a: 'string' });
        expect(items.headers).toContainEqual({
            key: 'Content-Type',
            value: 'application/json',
            active: true,
        });
        expect(items.auth).toEqual(
            expect.objectContaining({ type: 'apikey', apiKeyName: 'X-Key', apiKeyLocation: 'header' }),
        );
        expect(result.warnings.join(' ')).toMatch(/re-attach/);
    });

    it('drops file fields when the operation is not multipart', () => {
        const result = importAny(
            JSON.stringify({
                swagger: '2.0',
                info: { title: 'Forms' },
                host: 'x.test',
                consumes: ['application/x-www-form-urlencoded'],
                paths: {
                    '/f': {
                        post: {
                            parameters: [
                                { name: 'file', in: 'formData', type: 'file' },
                                { name: 'q', in: 'formData', type: 'string', default: 'hi' },
                            ],
                        },
                    },
                },
            }),
        );
        const request = result.requests[0].request;
        expect(request.bodyMode).toBe('urlencoded');
        expect(request.formFields).toEqual([{ key: 'q', value: 'hi', type: 'text', active: true }]);
        expect(result.warnings.join(' ')).toMatch(/needs multipart/);
    });
});

describe('OpenAPI bodies and auth edge cases', () => {
    it('maps urlencoded and multipart request bodies', () => {
        const result = importAny(
            JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Bodies' },
                servers: [{ url: 'https://b.test' }],
                paths: {
                    '/login': {
                        post: {
                            requestBody: {
                                content: {
                                    'application/x-www-form-urlencoded': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                username: { type: 'string', example: 'me' },
                                                password: { type: 'string', format: 'password' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '/upload': {
                        post: {
                            requestBody: {
                                content: {
                                    'multipart/form-data': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                file: { type: 'string', format: 'binary' },
                                                note: { type: 'string' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
        );
        const byName = Object.fromEntries(result.requests.map((r) => [r.name, r.request]));

        expect(byName['POST /login'].bodyMode).toBe('urlencoded');
        expect(byName['POST /login'].formFields).toEqual([
            { key: 'username', value: 'me', type: 'text', active: true },
            { key: 'password', value: '', type: 'text', active: true },
        ]);
        expect(byName['POST /login'].headers).toContainEqual({
            key: 'Content-Type',
            value: 'application/x-www-form-urlencoded',
            active: true,
        });

        expect(byName['POST /upload'].bodyMode).toBe('multipart');
        expect(byName['POST /upload'].formFields[0]).toEqual({
            key: 'file',
            value: '',
            type: 'file',
            active: true,
        });
        expect(result.warnings.join(' ')).toMatch(/re-attach/);
    });

    it('falls through combined and unsupported auth schemes with a warning', () => {
        const result = importAny(
            JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Auth' },
                servers: [{ url: 'https://a.test' }],
                security: [{ cookieKey: [] }, { oauth: [] }],
                paths: { '/x': { get: {} } },
                components: {
                    securitySchemes: {
                        cookieKey: { type: 'apiKey', in: 'cookie', name: 'sid' },
                        oauth: { type: 'oauth2', flows: {} },
                    },
                },
            }),
        );
        expect(result.requests[0].request.auth).toEqual(
            expect.objectContaining({ type: 'bearer', bearerToken: '{{accessToken}}' }),
        );
        expect(result.warnings.join(' ')).toMatch(/cookie/);
        expect(result.warnings.join(' ')).toMatch(/OAuth2/);
    });

    it('warns about dropped binary bodies', () => {
        const result = importAny(
            JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Bin' },
                servers: [{ url: 'https://bin.test' }],
                paths: {
                    '/blob': {
                        put: { requestBody: { content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } } },
                    },
                },
            }),
        );
        expect(result.requests[0].request.bodyMode).toBe('none');
        expect(result.warnings.join(' ')).toMatch(/not supported/);
    });

    it('rejects specs with no operations', () => {
        expect(() =>
            importAny(JSON.stringify({ openapi: '3.0.0', info: { title: 'Empty' }, paths: {} })),
        ).toThrow(/no operations/);
    });

    it('does not mistake other documents for OpenAPI', () => {
        expect(isOpenApiSpec({ openapi: '3.0.0' })).toBe(false);
        expect(isOpenApiSpec({ info: { name: 'x' }, item: [] })).toBe(false);
        expect(isOpenApiSpec({ openapi: '3.0.0', paths: {} })).toBe(true);
    });
});
