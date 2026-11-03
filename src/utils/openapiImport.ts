/**
 * OpenAPI 3.x / Swagger 2.0 → UtilHub API Client collections.
 *
 * One folder per tag (nested under the API title), one request per operation, and
 * one environment per declared server so `{{baseUrl}}` can be swapped. Credentials
 * are never invented: auth schemes become `{{token}}` / `{{apiKey}}` placeholders
 * and stay unresolved until the user supplies them.
 */
import type { Environment } from "@/hooks/useEnvironments";
import type { ImportResult } from "@/utils/apiClientInterop";
import {
    type AuthState,
    type BodyMode,
    type FormField,
    type KVItem,
    type RequestState,
    buildUrl,
    migrateRequestState,
} from "@/utils/apiClientRequest";
import { type Folder, type SavedRequest, newId } from "@/utils/apiClientStore";

// ---------------------------------------------------------------------------
// Minimal spec shapes (documents are user-supplied JSON, so everything is optional)
// ---------------------------------------------------------------------------

interface OpenApiSchema {
    $ref?: string;
    type?: string;
    format?: string;
    properties?: Record<string, OpenApiSchema>;
    items?: OpenApiSchema;
    enum?: unknown[];
    const?: unknown;
    example?: unknown;
    examples?: unknown;
    default?: unknown;
    allOf?: OpenApiSchema[];
    oneOf?: OpenApiSchema[];
    anyOf?: OpenApiSchema[];
    additionalProperties?: OpenApiSchema | boolean;
    readOnly?: boolean;
    minimum?: number;
}

interface OpenApiMediaType {
    schema?: OpenApiSchema;
    example?: unknown;
    examples?: Record<string, unknown>;
}

interface OpenApiParameter {
    $ref?: string;
    name?: string;
    in?: string;
    required?: boolean;
    schema?: OpenApiSchema;
    content?: Record<string, OpenApiMediaType>;
    example?: unknown;
    examples?: Record<string, unknown>;
    // Swagger 2 keeps the schema inline on the parameter
    type?: string;
    format?: string;
    items?: OpenApiSchema;
    default?: unknown;
    enum?: unknown[];
}

interface OpenApiOperation {
    operationId?: string;
    summary?: string;
    tags?: unknown;
    parameters?: unknown;
    requestBody?: { $ref?: string; content?: Record<string, OpenApiMediaType>; required?: boolean };
    security?: unknown;
    deprecated?: boolean;
    consumes?: unknown;
}

interface OpenApiPathItem {
    $ref?: string;
    parameters?: unknown;
}

interface SecurityScheme {
    $ref?: string;
    type?: string;
    scheme?: string;
    name?: string;
    in?: string;
    flows?: unknown;
}

interface OpenApiDocument {
    openapi?: string;
    swagger?: string;
    info?: { title?: string; version?: string };
    servers?: unknown;
    security?: unknown;
    securityDefinitions?: Record<string, unknown>;
    components?: { securitySchemes?: Record<string, unknown> };
    paths?: unknown;
    webhooks?: unknown;
    host?: string;
    basePath?: string;
    schemes?: unknown;
    consumes?: unknown;
}

interface ServerLike {
    url?: string;
    description?: string;
    variables?: Record<string, { default?: string; enum?: string[] }>;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const METHODS = ["get", "post", "put", "patch", "delete", "head", "options", "trace"] as const;
const MAX_SCHEMA_DEPTH = 6;
const FILE_WARNING = "File fields were imported without their files — re-attach them before sending.";

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function str(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Resolve a local JSON pointer (`#/components/schemas/Pet`). External refs are ignored. */
function lookupPointer(doc: unknown, ref: string): unknown {
    if (!ref.startsWith("#/")) return undefined;
    return ref
        .slice(2)
        .split("/")
        .reduce<unknown>((node, raw) => {
            if (!isObject(node)) return undefined;
            return node[raw.replace(/~1/g, "/").replace(/~0/g, "~")];
        }, doc);
}

function deref<T>(value: unknown, doc: unknown): T | undefined {
    if (!isObject(value)) return undefined;
    const ref = str(value.$ref);
    if (!ref) return value as T;
    const resolved = lookupPointer(doc, ref);
    return isObject(resolved) ? ({ ...resolved, ...value } as T) : undefined;
}

function resolveSchema(schema: OpenApiSchema | undefined, doc: unknown, seen = new Set<string>()): OpenApiSchema | undefined {
    if (!schema) return undefined;
    const ref = schema.$ref;
    if (!ref) return schema;
    if (seen.has(ref)) return undefined;
    const resolved = lookupPointer(doc, ref);
    if (!isObject(resolved)) return undefined;
    seen.add(ref);
    const { $ref: _ref, ...siblings } = schema;
    return resolveSchema({ ...(resolved as OpenApiSchema), ...siblings }, doc, seen);
}

// ---------------------------------------------------------------------------
// Schema → example
// ---------------------------------------------------------------------------

interface ExampleOptions {
    depth: number;
    seen: Set<string>;
    /** Request bodies drop `readOnly` properties, which the server already owns. */
    request: boolean;
}

function stringSample(schema: OpenApiSchema): string {
    switch ((schema.format || "").toLowerCase()) {
        case "date-time":
            return "2024-01-01T00:00:00Z";
        case "date":
            return "2024-01-01";
        case "time":
            return "12:00:00Z";
        case "email":
            return "user@example.com";
        case "uuid":
            return "3fa85f64-5717-4562-b3fc-2c963f66afa6";
        case "uri":
        case "url":
        case "uri-reference":
            return "https://example.com";
        case "hostname":
            return "example.com";
        case "ipv4":
            return "192.0.2.1";
        case "binary":
        case "byte":
        case "password":
            return "";
        default:
            return "string";
    }
}

/** Build a plausible JSON value from a schema. Returns undefined when there is nothing to say. */
export function schemaExample(
    schema: OpenApiSchema | undefined,
    doc: unknown,
    options: ExampleOptions = { depth: 0, seen: new Set(), request: true },
): unknown {
    if (!schema || options.depth > MAX_SCHEMA_DEPTH) return undefined;

    if (schema.$ref) {
        // A self-reference is followed once, then cut so recursive models terminate.
        if (options.seen.has(schema.$ref)) return {};
        const resolved = deref<OpenApiSchema>(schema, doc);
        if (!resolved) return undefined;
        const { $ref: _ref, ...rest } = resolved;
        return schemaExample(rest as OpenApiSchema, doc, {
            ...options,
            depth: options.depth + 1,
            seen: new Set(options.seen).add(schema.$ref),
        });
    }

    if (schema.example !== undefined) return schema.example;
    if (Array.isArray(schema.examples) && schema.examples.length > 0) return schema.examples[0];
    if (schema.const !== undefined) return schema.const;
    if (schema.default !== undefined) return schema.default;
    if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];

    if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
        const merged: Record<string, unknown> = {};
        schema.allOf.forEach((part) => {
            const value = schemaExample(part, doc, { ...options, depth: options.depth + 1 });
            if (isObject(value)) Object.assign(merged, value);
        });
        return merged;
    }

    const variant = schema.oneOf?.[0] ?? schema.anyOf?.[0];
    if (variant) return schemaExample(variant, doc, { ...options, depth: options.depth + 1 });

    const type = schema.type || (schema.properties ? "object" : schema.items ? "array" : undefined);

    if (type === "object") {
        const out: Record<string, unknown> = {};
        Object.entries(schema.properties || {}).forEach(([key, prop]) => {
            if (options.request && prop?.readOnly) return;
            const value = schemaExample(prop, doc, { ...options, depth: options.depth + 1 });
            if (value !== undefined) out[key] = value;
        });
        if (Object.keys(out).length === 0 && isObject(schema.additionalProperties)) {
            out.key = schemaExample(schema.additionalProperties, doc, { ...options, depth: options.depth + 1 });
        }
        return out;
    }

    if (type === "array") {
        const item = schemaExample(schema.items, doc, { ...options, depth: options.depth + 1 });
        return item === undefined ? [] : [item];
    }

    if (type === "string") return stringSample(schema);
    if (type === "integer" || type === "number") return schema.minimum ?? 0;
    if (type === "boolean") return true;
    if (type === "null") return null;

    return undefined;
}

function objectProperties(schema: OpenApiSchema | undefined, doc: unknown): Record<string, OpenApiSchema> {
    const resolved = resolveSchema(schema, doc);
    if (!resolved) return {};
    const props: Record<string, OpenApiSchema> = { ...(resolved.properties || {}) };
    (resolved.allOf || []).forEach((part) => Object.assign(props, objectProperties(part, doc)));
    return props;
}

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

/** Only explicit values are used for parameters; generic samples would send `?q=string`. */
function explicitParamValue(param: OpenApiParameter): string | undefined {
    const named = isObject(param.examples) ? Object.values(param.examples)[0] : undefined;
    const namedValue = isObject(named) && named.value !== undefined ? named.value : named;
    const candidates = [
        param.example,
        namedValue,
        param.schema?.example,
        param.schema?.default,
        Array.isArray(param.schema?.enum) ? param.schema.enum[0] : undefined,
        param.default,
        Array.isArray(param.enum) ? param.enum[0] : undefined,
    ];
    for (const candidate of candidates) {
        if (candidate === undefined || candidate === null) continue;
        if (typeof candidate === "string") {
            if (candidate) return candidate;
            continue;
        }
        if (typeof candidate === "number" || typeof candidate === "boolean") return String(candidate);
        return JSON.stringify(candidate);
    }
    return undefined;
}

function paramToken(param: OpenApiParameter): string {
    return explicitParamValue(param) ?? `{{${param.name}}}`;
}

function operationParameters(item: OpenApiPathItem, op: OpenApiOperation, doc: unknown): OpenApiParameter[] {
    const merged: OpenApiParameter[] = [];
    const add = (raw: unknown) => {
        const param = deref<OpenApiParameter>(raw, doc);
        if (!param?.name || !param.in) return;
        const index = merged.findIndex((p) => p.in === param.in && p.name === param.name);
        if (index >= 0) merged[index] = param;
        else merged.push(param);
    };
    asArray<unknown>(item.parameters).forEach(add);
    asArray<unknown>(op.parameters).forEach(add);
    return merged;
}

// ---------------------------------------------------------------------------
// Bodies
// ---------------------------------------------------------------------------

interface BodyPlan {
    bodyMode: BodyMode;
    body: string;
    formFields: FormField[];
    contentType?: string;
}

const EMPTY_BODY: BodyPlan = { bodyMode: "none", body: "", formFields: [] };

function mediaValue(media: OpenApiMediaType | undefined, doc: unknown): unknown {
    if (!media) return undefined;
    if (media.example !== undefined) return media.example;
    const named = isObject(media.examples) ? Object.values(media.examples)[0] : undefined;
    if (isObject(named) && named.value !== undefined) return named.value;
    if (named !== undefined) return named;
    return schemaExample(media.schema, doc);
}

function stringifySample(value: unknown): string {
    if (value === undefined || value === null) return "";
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function formFieldsFromSchema(schema: OpenApiSchema | undefined, doc: unknown, allowFiles: boolean, warnings: Set<string>): FormField[] {
    const fields: FormField[] = [];
    Object.entries(objectProperties(schema, doc)).forEach(([key, prop]) => {
        const resolved = resolveSchema(prop, doc) || prop;
        const isFile = resolved.type === "file" || (resolved.type === "string" && resolved.format === "binary");
        if (isFile) {
            if (!allowFiles) {
                warnings.add(`Binary field "${key}" cannot be sent as x-www-form-urlencoded and was dropped.`);
                return;
            }
            warnings.add(FILE_WARNING);
            fields.push({ key, value: "", type: "file", active: true });
            return;
        }
        fields.push({ key, value: stringifySample(schemaExample(resolved, doc)), type: "text", active: true });
    });
    return fields;
}

function bodyFromContent(content: Record<string, OpenApiMediaType> | undefined, doc: unknown, warnings: Set<string>): BodyPlan {
    const entries = Object.entries(content || {});
    if (entries.length === 0) return EMPTY_BODY;
    const find = (predicate: (contentType: string) => boolean) =>
        entries.find(([contentType]) => predicate(contentType.toLowerCase()));

    const json = find((ct) => ct.includes("json"));
    if (json) {
        return {
            bodyMode: "json",
            body: JSON.stringify(mediaValue(json[1], doc) ?? {}, null, 2),
            formFields: [],
            contentType: json[0],
        };
    }

    const urlencoded = find((ct) => ct.startsWith("application/x-www-form-urlencoded"));
    if (urlencoded) {
        return {
            bodyMode: "urlencoded",
            formFields: formFieldsFromSchema(urlencoded[1].schema, doc, false, warnings),
            body: "",
            contentType: "application/x-www-form-urlencoded",
        };
    }

    const multipart = find((ct) => ct.startsWith("multipart/form-data"));
    if (multipart) {
        return {
            bodyMode: "multipart",
            formFields: formFieldsFromSchema(multipart[1].schema, doc, true, warnings),
            body: "",
            contentType: undefined,
        };
    }

    const text = find((ct) => ct.startsWith("text/"));
    if (text) {
        return { bodyMode: "raw", body: stringifySample(mediaValue(text[1], doc)), formFields: [], contentType: text[0] };
    }

    const [contentType, media] = entries[0];
    const sample = mediaValue(media, doc);
    if (typeof sample !== "string" || sample.length === 0) {
        warnings.add(`Content type "${contentType}" is not supported and its body was dropped.`);
        return EMPTY_BODY;
    }
    warnings.add(`Content type "${contentType}" was imported as a raw text body.`);
    return { bodyMode: "raw", body: sample, formFields: [], contentType };
}

function swaggerBody(
    params: OpenApiParameter[],
    doc: OpenApiDocument,
    op: OpenApiOperation,
    warnings: Set<string>,
): BodyPlan {
    const consumes = (asArray<string>(op.consumes).length > 0
        ? asArray<string>(op.consumes)
        : asArray<string>(doc.consumes)
    ).map((c) => c.toLowerCase());

    const bodyParam = params.find((p) => p.in === "body");
    if (bodyParam) {
        const sample = schemaExample(bodyParam.schema, doc);
        const isJson = typeof sample === "object" && sample !== null;
        if (isJson) {
            return {
                bodyMode: "json",
                body: JSON.stringify(sample, null, 2),
                formFields: [],
                contentType: consumes.find((c) => c.includes("json")) || "application/json",
            };
        }
        return {
            bodyMode: "raw",
            body: stringifySample(sample),
            formFields: [],
            contentType: consumes[0] || "text/plain",
        };
    }

    const formParams = params.filter((p) => p.in === "formData");
    if (formParams.length === 0) return EMPTY_BODY;

    const isMultipart = consumes.some((c) => c.startsWith("multipart/form-data"));
    const fields: FormField[] = [];
    formParams.forEach((param) => {
        if (!param.name) return;
        if (param.type === "file") {
            if (!isMultipart) {
                warnings.add(`File field "${param.name}" needs multipart/form-data and was dropped.`);
                return;
            }
            warnings.add(FILE_WARNING);
            fields.push({ key: param.name, value: "", type: "file", active: true });
            return;
        }
        fields.push({ key: param.name, value: explicitParamValue(param) ?? "", type: "text", active: true });
    });

    return isMultipart
        ? { bodyMode: "multipart", formFields: fields, body: "" }
        : { bodyMode: "urlencoded", formFields: fields, body: "", contentType: "application/x-www-form-urlencoded" };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const BEARER: AuthState = { type: "bearer", bearerToken: "{{token}}" };
const BASIC: AuthState = { type: "basic", basicUsername: "{{username}}", basicPassword: "{{password}}" };
const OAUTH_BEARER: AuthState = { type: "bearer", bearerToken: "{{accessToken}}" };

function mapScheme(name: string, raw: unknown, doc: unknown, warnings: Set<string>): AuthState | undefined {
    const scheme = deref<SecurityScheme>(raw, doc);
    if (!scheme?.type) return undefined;
    const type = scheme.type.toLowerCase();

    if (type === "http") {
        const httpScheme = (scheme.scheme || "").toLowerCase();
        if (httpScheme === "bearer") return { ...BEARER };
        if (httpScheme === "basic") return { ...BASIC };
        warnings.add(`HTTP auth scheme "${httpScheme || "unknown"}" ("${name}") is not supported and was dropped.`);
        return undefined;
    }

    if (type === "basic") return { ...BASIC };

    if (type === "apikey") {
        const location = (scheme.in || "header").toLowerCase();
        if (location === "cookie") {
            warnings.add(`API key "${name}" is sent as a cookie, which this client cannot store; it was dropped.`);
            return undefined;
        }
        return {
            type: "apikey",
            apiKeyName: scheme.name || name,
            apiKeyValue: "{{apiKey}}",
            apiKeyLocation: location === "query" ? "query" : "header",
        };
    }

    if (type === "oauth2" || type === "openidconnect") {
        warnings.add(`OAuth2/OpenID Connect scheme "${name}" was imported as a bearer token — request a token externally.`);
        return { ...OAUTH_BEARER };
    }

    warnings.add(`Auth type "${scheme.type}" ("${name}") is not supported and was dropped.`);
    return undefined;
}

function authFor(op: OpenApiOperation, doc: OpenApiDocument, warnings: Set<string>): AuthState {
    const own = op.security === undefined ? undefined : asArray<unknown>(op.security);
    const requirements = own ?? asArray<unknown>(doc.security);
    if (requirements.length === 0) return { type: "none" };

    const schemes: Record<string, unknown> = {
        ...(doc.securityDefinitions || {}),
        ...(doc.components?.securitySchemes || {}),
    };

    for (const requirement of requirements) {
        if (!isObject(requirement)) continue;
        const names = Object.keys(requirement);
        // `security: [{}]` means "this operation is public"
        if (names.length === 0) return { type: "none" };
        const mapped = names
            .map((name) => ({ name, auth: mapScheme(name, schemes[name], doc, warnings) }))
            .filter((entry): entry is { name: string; auth: AuthState } => Boolean(entry.auth));
        if (mapped.length === 0) continue;
        if (mapped.length > 1) {
            warnings.add(
                `"${names.join(" + ")}" is a combined auth requirement; only "${mapped[0].name}" was configured.`,
            );
        }
        return mapped[0].auth;
    }
    return { type: "none" };
}

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------

function expandServerUrl(server: ServerLike): string {
    return (server.url || "").replace(/\{([^}]+)\}/g, (_match, name: string) => {
        const variable = server.variables?.[name];
        return variable?.default ?? variable?.enum?.[0] ?? "";
    });
}

function environmentsFor(doc: OpenApiDocument, title: string, warnings: Set<string>): Environment[] {
    const servers = asArray<ServerLike>(doc.servers).filter((s) => str(s?.url));
    const make = (name: string, baseUrl: string): Environment => ({
        id: newId(),
        name,
        variables: [{ key: "baseUrl", value: baseUrl, enabled: true }],
    });

    if (servers.length > 0) {
        const urls = servers.map(expandServerUrl);
        if (urls.some((url) => !/^[a-z][a-z0-9+.-]*:\/\//i.test(url))) {
            warnings.add("A server URL in this spec is relative — set baseUrl to the API host before sending.");
        }
        return servers.map((server, index) => {
            const baseUrl = urls[index];
            const label = str(server.description) || baseUrl;
            return make(servers.length === 1 ? title : `${title} (${label})`, baseUrl);
        });
    }

    if (doc.swagger) {
        const host = str(doc.host);
        const basePath = str(doc.basePath) || "";
        if (!host) {
            warnings.add("The spec declares no host; baseUrl was set to http://localhost.");
            return [make(title, `http://localhost${basePath}`)];
        }
        const scheme = asArray<string>(doc.schemes)[0] || "https";
        return [make(title, `${scheme.replace(/:.*/, "")}://${host}${basePath}`)];
    }

    warnings.add("The spec declares no servers; baseUrl was set to http://localhost.");
    return [make(title, "http://localhost")];
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

function operationName(op: OpenApiOperation, method: string, path: string): string {
    return str(op.summary) || str(op.operationId) || `${method.toUpperCase()} ${path}`;
}

/** Untagged operations group by resource: `/v1/charges/{id}` → `charges`. */
function pathGroup(path: string): string | undefined {
    return path
        .split("/")
        .filter(Boolean)
        .find(
            (segment) =>
                !segment.startsWith("{") &&
                !/^v\d+(\.\d+)*$/i.test(segment) &&
                !/^(api|rest|services)$/i.test(segment),
        );
}

function operationRequest(
    path: string,
    method: string,
    op: OpenApiOperation,
    item: OpenApiPathItem,
    doc: OpenApiDocument,
    warnings: Set<string>,
): RequestState {
    const params = operationParameters(item, op, doc);

    const query: KVItem[] = params
        .filter((p) => p.in === "query")
        .map((p) => ({ key: p.name!, value: paramToken(p), active: p.required === true }));

    const headers: KVItem[] = params
        .filter((p) => p.in === "header")
        .map((p) => ({ key: p.name!, value: paramToken(p), active: p.required === true }));

    if (params.some((p) => p.in === "cookie")) {
        warnings.add("Cookie parameters were skipped — this client does not keep a cookie jar.");
    }

    const urlPath = path.replace(/\{([^}]+)\}/g, (_match, name: string) => `{{${name.trim()}}}`);
    let plan: BodyPlan = EMPTY_BODY;

    if (doc.swagger) {
        plan = swaggerBody(params, doc, op, warnings);
    } else {
        const requestBody = deref<NonNullable<OpenApiOperation["requestBody"]>>(op.requestBody, doc);
        plan = bodyFromContent(requestBody?.content, doc, warnings);
    }

    if (plan.contentType && !headers.some((h) => h.key.toLowerCase() === "content-type")) {
        headers.push({ key: "Content-Type", value: plan.contentType, active: true });
    }

    const url = buildUrl(`{{baseUrl}}${urlPath}`, query);

    return migrateRequestState({
        method: method.toUpperCase(),
        url,
        params: query,
        headers,
        auth: authFor(op, doc, warnings),
        bodyMode: plan.bodyMode,
        body: plan.body,
        formFields: plan.formFields,
    });
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

export function isOpenApiSpec(value: unknown): boolean {
    if (!isObject(value)) return false;
    const version = String(value.openapi ?? value.swagger ?? "").trim();
    if (!version) return false;
    if (!isObject(value.paths) && !isObject(value.webhooks)) return false;
    return /^3(\.|$)/.test(version) || /^2(\.0)?$/.test(version);
}

export function importOpenApi(input: Record<string, unknown>): ImportResult {
    const doc = input as OpenApiDocument;
    const warnings = new Set<string>();
    const isSwagger2 = String(doc.swagger ?? "").startsWith("2");
    const title = str(doc.info?.title) || "Imported API";

    const folders: Folder[] = [];
    const folderIds = new Map<string, string>();
    const ensureFolder = (name: string): string => {
        const existing = folderIds.get(name);
        if (existing) return existing;
        const folder = { id: newId(), name };
        folders.push(folder);
        folderIds.set(name, folder.id);
        return folder.id;
    };

    const requests: SavedRequest[] = [];
    const paths = isObject(doc.paths) ? doc.paths : {};

    Object.entries(paths).forEach(([path, rawItem]) => {
        const item = deref<OpenApiPathItem>(rawItem, doc);
        if (!item) return;
        METHODS.forEach((method) => {
            const op = isObject((item as Record<string, unknown>)[method])
                ? ((item as Record<string, unknown>)[method] as OpenApiOperation)
                : undefined;
            if (!op) return;

            const tag = asArray<string>(op.tags).map((t) => str(t)).find((t): t is string => Boolean(t));
            const group = tag ?? pathGroup(path);
            const folderId = ensureFolder(group ? `${title} / ${group}` : title);
            requests.push({
                id: newId(),
                name: operationName(op, method, path),
                folderId,
                timestamp: Date.now(),
                request: operationRequest(path, method, op, item, doc, warnings),
            });
        });
    });

    if (Object.keys(paths).length > 0 && isObject(doc.webhooks)) {
        warnings.add("Webhooks were skipped — only path operations are imported.");
    }
    if (requests.length === 0) {
        throw new Error("The OpenAPI document contains no operations to import.");
    }

    const version = isSwagger2 ? "Swagger 2.0" : `OpenAPI ${str(doc.openapi) ?? "3.x"}`;
    return {
        folders,
        requests,
        environments: environmentsFor(doc, title, warnings),
        warnings: [...warnings],
        source: "openapi",
        note: `${version} · ${title} — ${requests.length} request${requests.length === 1 ? "" : "s"}`,
    };
}
