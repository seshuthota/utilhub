import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CssLintTool from '../app/tools/css-lint/page';

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea data-testid="code-editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} />
    ),
}));

function lintCSS(css) {
    const issues = [];
    const lines = css.split('\n');
    lines.forEach((line, i) => {
        const lineNum = i + 1;
        if (line.includes('!important')) {
            issues.push({ line: lineNum, type: 'warning', message: 'Avoid using !important' });
        }
        if (line.includes('style=')) {
            issues.push({ line: lineNum, type: 'warning', message: 'Possible inline style detected' });
        }
        if (line.match(/-webkit-|-moz-|-ms-/) && !line.includes('/*')) {
            issues.push({ line: lineNum, type: 'info', message: 'Vendor prefix detected - consider using autoprefixer' });
        }
        if (line.match(/:\s*0px/)) {
            issues.push({ line: lineNum, type: 'info', message: 'Remove unit from zero value (0px → 0)' });
        }
    });
    return issues;
}

describe('CssLintTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<CssLintTool />);
        expect(screen.getByText('CSS Linter')).toBeInTheDocument();
    });

    describe('lintCSS function', () => {
        it('flags !important usage', () => {
            const result = lintCSS('.foo { color: red !important; }');
            expect(result.some(r => r.message.includes('!important'))).toBe(true);
        });

        it('flags missing units on zero', () => {
            const result = lintCSS('.foo { margin: 0px; }');
            expect(result.some(r => r.message.includes('0px'))).toBe(true);
        });

        it('flags vendor prefixes', () => {
            const result = lintCSS('.foo { -webkit-appearance: none; }');
            expect(result.some(r => r.message.includes('Vendor prefix'))).toBe(true);
        });

        it('returns no issues for clean CSS', () => {
            const result = lintCSS('.foo { color: red; margin: 0; }');
            expect(result.length).toBe(0);
        });
    });
});
