import { describe, it, expect } from 'vitest';
import {
    getToolAdapter,
    getExamplePipelines,
    generateShareUrl,
    loadFromUrl,
    detectInputType,
} from '@/utils/pipeline';

describe('pipeline adapters', () => {
    it('registers regex and case-converter adapters', () => {
        expect(getToolAdapter('regex')?.modes).toContain('redact-emails');
        expect(getToolAdapter('case-converter')?.modes).toContain('snake');
    });

    it('redacts emails', () => {
        const { output } = getToolAdapter('regex').transform(
            'Contact a@b.com and c@d.org',
            { mode: 'redact-emails' },
        );
        expect(output).toBe('Contact [REDACTED] and [REDACTED]');
    });

    it('extracts urls', () => {
        const { output } = getToolAdapter('regex').transform(
            'See https://example.com/x and http://foo.test',
            { mode: 'extract-urls' },
        );
        expect(output).toContain('https://example.com/x');
        expect(output).toContain('http://foo.test');
    });

    it('converts to snake_case', () => {
        const { output } = getToolAdapter('case-converter').transform('HelloWorld foo-bar', {
            mode: 'snake',
        });
        expect(output).toBe('hello_world_foo_bar');
    });

    it('uses hash mode as algorithm', async () => {
        const result = getToolAdapter('hash').transform('hi', { mode: 'sha256' });
        const resolved = await Promise.resolve(result);
        expect(resolved.output).toMatch(/^[a-f0-9]{64}$/);
    });
});

describe('pipeline examples & share URL', () => {
    it('includes new templates', () => {
        const names = getExamplePipelines().map((p) => p.name);
        expect(names).toContain('Redact Emails');
        expect(names).toContain('Normalize Identifiers');
        expect(names).toContain('Extract URLs');
    });

    it('example steps store mode on options', () => {
        const jwt = getExamplePipelines().find((p) => p.name === 'JWT Debugger');
        expect(jwt.steps[0].options.mode).toBe('decode-payload');
    });

    it('round-trips share URL through /tools/pipeline', () => {
        const pipeline = getExamplePipelines()[0];
        const url = generateShareUrl(pipeline, 'https://utilhub.example');
        expect(url).toMatch(/^https:\/\/utilhub.example\/tools\/pipeline\?p=/);

        const encoded = new URL(url).searchParams;
        const loaded = loadFromUrl(encoded);
        expect(loaded).toBeTruthy();
        expect(loaded.steps.map((s) => s.toolId)).toEqual(pipeline.steps.map((s) => s.toolId));
    });

    it('detects JWT input type', () => {
        expect(
            detectInputType(
                'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc',
            ),
        ).toBe('jwt');
    });
});
