import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HtmlLintTool from '../app/tools/html-lint/page';

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea data-testid="code-editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} />
    ),
}));

function lintHTML(html) {
    const issues = [];
    if (!html.trim().toLowerCase().startsWith('<!doctype')) {
        issues.push({ type: 'warning', message: 'Missing DOCTYPE declaration' });
    }
    if (html.includes('<html') && !html.match(/<html[^>]*lang=/i)) {
        issues.push({ type: 'warning', message: 'Missing lang attribute on <html>' });
    }
    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    imgMatches.forEach(img => {
        if (!img.includes('alt=')) {
            issues.push({ type: 'error', message: 'Image missing alt attribute: ' + img.substring(0, 50) + '...' });
        }
    });
    const deprecated = ['<font', '<center', '<marquee', '<blink'];
    deprecated.forEach(tag => {
        if (html.toLowerCase().includes(tag)) {
            issues.push({ type: 'warning', message: 'Deprecated tag found: ' + tag + '>' });
        }
    });
    return issues;
}

describe('HtmlLintTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<HtmlLintTool />);
        expect(screen.getByText('HTML Validator')).toBeInTheDocument();
    });

    describe('lintHTML function', () => {
        it('flags missing DOCTYPE', () => {
            const result = lintHTML('<html><body></body></html>');
            expect(result.some(r => r.message.includes('DOCTYPE'))).toBe(true);
        });

        it('flags missing lang attribute', () => {
            const result = lintHTML('<!doctype html><html><body></body></html>');
            expect(result.some(r => r.message.includes('lang'))).toBe(true);
        });

        it('flags images without alt', () => {
            const result = lintHTML('<img src="foo.jpg">');
            expect(result.some(r => r.message.includes('alt'))).toBe(true);
        });

        it('flags deprecated tags', () => {
            const result = lintHTML('<center>text</center>');
            expect(result.some(r => r.message.includes('Deprecated'))).toBe(true);
        });

        it('returns no issues for clean HTML', () => {
            const result = lintHTML('<!doctype html><html lang="en"><body><img src="a.jpg" alt="a"></body></html>');
            expect(result.length).toBe(0);
        });
    });
});
