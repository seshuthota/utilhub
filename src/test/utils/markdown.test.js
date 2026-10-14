import { describe, it, expect } from 'vitest';
import {
    renderMarkdown, splitFrontmatter, frontmatterTable, documentStats, documentTitle, fileStem,
    buildHtmlDocument, encodeShare, decodeShare, readShareToken,
} from '@/utils/markdown';
import { highlightToHtml, normalizeLanguage } from '@/utils/codeHighlight';
import { sanitizeHtml } from '@/utils/sanitize';

describe('renderMarkdown (GFM)', () => {
    it('renders tables, task lists, strikethrough and autolinks', () => {
        const html = renderMarkdown('| a | b |\n| - | - |\n| 1 | 2 |\n\n- [x] done\n- [ ] todo\n\n~~old~~ https://example.com');
        expect(html).toContain('<table>');
        expect(html).toMatch(/<input[^>]*checked[^>]*type="checkbox"/);
        expect(html).toContain('<del>old</del>');
        expect(html).toContain('<a href="https://example.com">');
    });

    it('highlights fenced code by language and keeps the language class', () => {
        const html = renderMarkdown('```js\nconst x = "hi"; // note\n```');
        expect(html).toContain('<code class="language-js">');
        expect(html).toMatch(/<span class="tok-keyword">const<\/span>/);
        expect(html).toContain('<span class="tok-string">&quot;hi&quot;</span>');
        expect(html).toMatch(/<span class="tok-comment">\/\/ note<\/span>/);
    });

    it('escapes code in unknown languages and survives sanitizing', () => {
        const html = sanitizeHtml(renderMarkdown('```brainfuck\n<script>alert(1)</script>\n```'));
        expect(html).toContain('&lt;script&gt;');
        expect(html).not.toContain('<script>');
    });
});

describe('codeHighlight', () => {
    it('maps fence aliases and falls back to escaped text', () => {
        expect(normalizeLanguage('TS {linenos}')).toBe('ts');
        expect(highlightToHtml('a < b', 'nope')).toBe('a &lt; b');
        expect(highlightToHtml('SELECT 1', 'sql')).toContain('tok-keyword');
        expect(highlightToHtml('echo "hi"', 'bash')).toContain('<span');
    });
});

describe('frontmatter', () => {
    it('splits YAML frontmatter from the body', () => {
        const { frontmatter, body } = splitFrontmatter('---\ntitle: Hello\ntags: [a, b]\n---\n# Body');
        expect(frontmatter.data).toEqual({ title: 'Hello', tags: ['a', 'b'] });
        expect(body).toBe('# Body');
    });

    it('reports invalid YAML instead of throwing', () => {
        const { frontmatter, body } = splitFrontmatter('---\ntitle: [unclosed\n---\ntext');
        expect(frontmatter.data).toBeNull();
        expect(frontmatter.error).toBeTruthy();
        expect(body).toBe('text');
    });

    it('leaves documents without frontmatter alone (a leading rule is not frontmatter)', () => {
        expect(splitFrontmatter('# Title\n---\nmore').frontmatter).toBeNull();
    });

    it('renders an escaped metadata table', () => {
        const html = frontmatterTable({ title: '<b>x</b>', nested: { a: 1 } });
        expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
        expect(html).toContain('{&quot;a&quot;:1}');
    });
});

describe('stats and naming', () => {
    it('counts prose words, ignoring code and markup', () => {
        const stats = documentStats('# Hello world\n\nSome **bold** [link](http://x).\n\n```js\nconst ignored = 1;\n```');
        expect(stats.words).toBe(5);
        expect(stats.readingMinutes).toBe(1);
        expect(documentStats('').words).toBe(0);
        expect(documentStats('').readingMinutes).toBe(0);
    });

    it('derives titles and safe file names', () => {
        expect(documentTitle('intro\n## My *Great* Doc', null)).toBe('My Great Doc');
        expect(documentTitle('# Heading', { data: { title: 'From YAML' }, raw: '' })).toBe('From YAML');
        expect(fileStem('Release notes: v2.4 / Final!')).toBe('release-notes-v2-4-final');
        expect(fileStem('***')).toBe('document');
    });
});

describe('HTML export', () => {
    it('produces a standalone document with escaped title and no scripts', () => {
        const doc = buildHtmlDocument('<p>hi</p>', 'A <b> title');
        expect(doc).toMatch(/^<!doctype html>/);
        expect(doc).toContain('<title>A &lt;b&gt; title</title>');
        expect(doc).toContain('<p>hi</p>');
        expect(doc).not.toMatch(/<script/i);
    });
});

describe('share links', () => {
    it('round-trips unicode documents through the fragment token', async () => {
        const source = '# Héllo ✓\n\n'.repeat(50);
        const token = await encodeShare(source);
        expect(token).toMatch(/^[zu]\.[A-Za-z0-9_-]+$/);
        expect(await decodeShare(token)).toBe(source);
    });

    it('compresses repetitive documents when CompressionStream exists', async () => {
        if (typeof CompressionStream === 'undefined') return;
        const source = 'lorem ipsum dolor '.repeat(500);
        const token = await encodeShare(source);
        expect(token.startsWith('z.')).toBe(true);
        expect(token.length).toBeLessThan(source.length / 10);
    });

    it('rejects damaged tokens and reads the fragment key', async () => {
        expect(await decodeShare('z.!!!')).toBeNull();
        expect(await decodeShare('nonsense')).toBeNull();
        expect(readShareToken('#md=u.abc&x=1')).toBe('u.abc');
        expect(readShareToken('#other=1')).toBeNull();
    });
});
