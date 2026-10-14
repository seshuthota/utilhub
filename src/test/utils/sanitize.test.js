import { describe, it, expect, vi } from 'vitest';
import { marked } from 'marked';
import { sanitizeHtml } from '@/utils/sanitize';

function toDom(html) {
    const container = document.createElement('div');
    container.innerHTML = sanitizeHtml(html);
    return container;
}

// Nothing in the output may be active content, an event handler or a JS URL.
function assertInert(container) {
    expect(container.querySelector('script, iframe, form, object, embed, svg, math, style')).toBeNull();
    for (const el of container.querySelectorAll('*')) {
        for (const attr of el.attributes) {
            expect(attr.name.toLowerCase()).not.toMatch(/^on/);
            expect(attr.name.toLowerCase()).not.toBe('srcdoc');
            expect(attr.value.replace(/\s/g, '').toLowerCase()).not.toContain('javascript:');
        }
    }
}

describe('sanitizeHtml', () => {
    describe('neutralises confirmed bypasses of the old regex sanitizer', () => {
        const payloads = {
            'slash-separated onerror': '<img/src=x/onerror=alert(1)>',
            'unquoted javascript: href': '<a href=javascript:alert(1)>x</a>',
            'iframe srcdoc': '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
            'svg xlink:href javascript:': '<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>',
            'svg animate to javascript:':
                '<svg><a><animate attributeName="href" to="javascript:alert(1)"/><text>x</text></a></svg>',
            'script tag': '<script>alert(1)</script>',
            'mixed-case handler': '<div OnMouseOver="alert(1)">x</div>',
            'entity-encoded javascript: URL': '<a href="&#106;avascript:alert(1)">x</a>',
            'form with formaction': '<form><button formaction="javascript:alert(1)">x</button></form>',
        };

        for (const [name, payload] of Object.entries(payloads)) {
            it(name, () => {
                assertInert(toDom(payload));
            });
        }

        it('keeps harmless content around a stripped payload', () => {
            const dom = toDom('<p>before<img/src=x/onerror=alert(1)>after</p>');
            expect(dom.textContent).toBe('beforeafter');
            expect(dom.querySelector('img')?.getAttribute('onerror')).toBeNull();
        });
    });

    it('preserves normal GitHub-flavoured markdown output', () => {
        const md = [
            '# Title',
            '## Subtitle',
            '',
            'Some **bold** and *italic* text with a [link](https://example.com "Example").',
            '',
            '| Name | Value |',
            '| :--- | ---: |',
            '| a | 1 |',
            '',
            '```js',
            'console.log("<b>hi</b>");',
            '```',
            '',
            '- [x] done',
            '- [ ] todo',
            '',
            '![alt text](https://example.com/a.png)',
        ].join('\n');

        const dom = toDom(marked.parse(md, { async: false }));

        expect(dom.querySelector('h1')?.textContent).toBe('Title');
        expect(dom.querySelector('h2')?.textContent).toBe('Subtitle');
        expect(dom.querySelector('strong')?.textContent).toBe('bold');
        expect(dom.querySelector('em')?.textContent).toBe('italic');

        const link = dom.querySelector('a');
        expect(link?.getAttribute('href')).toBe('https://example.com');
        expect(link?.getAttribute('title')).toBe('Example');

        expect(dom.querySelectorAll('table th')).toHaveLength(2);
        expect(dom.querySelectorAll('table td')).toHaveLength(2);
        expect(dom.querySelector('th')?.getAttribute('align')).toBe('left');

        const code = dom.querySelector('pre code');
        expect(code?.className).toContain('language-js');
        expect(code?.textContent).toContain('console.log("<b>hi</b>");');

        expect(dom.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
        expect(dom.querySelector('img')?.getAttribute('src')).toBe('https://example.com/a.png');
    });

    it('adds rel="noopener noreferrer" to target="_blank" links', () => {
        const dom = toDom('<a href="https://example.com" target="_blank" rel="opener">x</a>');
        const link = dom.querySelector('a');
        expect(link?.getAttribute('target')).toBe('_blank');
        expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('drops targets other than _blank', () => {
        const dom = toDom('<a href="https://example.com" target="_top">x</a>');
        expect(dom.querySelector('a')?.hasAttribute('target')).toBe(false);
    });

    it('returns an empty string for empty input', () => {
        expect(sanitizeHtml('')).toBe('');
    });

    it('returns an empty string without a DOM (SSR) instead of passing markup through', async () => {
        vi.resetModules();
        vi.stubGlobal('window', undefined);
        try {
            const { sanitizeHtml: serverSanitize } = await import('@/utils/sanitize');
            expect(serverSanitize('<img src=x onerror=alert(1)><p>hi</p>')).toBe('');
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
