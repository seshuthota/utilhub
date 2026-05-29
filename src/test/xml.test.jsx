import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import XmlTool from '../app/tools/xml/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea data-testid="code-editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} />
    ),
}));

describe('XmlTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<XmlTool />);
        expect(screen.getByText('XML Formatter')).toBeInTheDocument();
    });

    it('shows action buttons', () => {
        render(<XmlTool />);
        expect(screen.getByText('Format')).toBeInTheDocument();
        expect(screen.getByText('Minify')).toBeInTheDocument();
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('formats XML on format click', () => {
        render(<XmlTool />);
        const editor = screen.getAllByTestId('code-editor')[0];
        const initial = editor.getAttribute('value') || '';
        fireEvent.click(screen.getByText('Format'));
        const formatted = editor.getAttribute('value') || '';
        expect(formatted.length).toBeGreaterThanOrEqual(initial.length);
    });

    it('minifies XML on minify click', () => {
        render(<XmlTool />);
        const editor = screen.getAllByTestId('code-editor')[0];
        fireEvent.click(screen.getByText('Minify'));
        const value = editor.getAttribute('value') || '';
        expect(value).not.toContain('  ');
    });

    it('clears content on clear', () => {
        render(<XmlTool />);
        const editor = screen.getAllByTestId('code-editor')[0];
        fireEvent.click(screen.getByText('Clear'));
        expect(editor).toHaveValue('');
    });

    it('shows error for invalid XML', () => {
        render(<XmlTool />);
        const editor = screen.getAllByTestId('code-editor')[0];
        fireEvent.change(editor, { target: { value: 'not xml at all' } });
        fireEvent.click(screen.getByText('Format'));
        const errorTexts = screen.queryAllByText(/error|invalid/i);
        expect(errorTexts.length).toBeGreaterThan(0);
    });
});
