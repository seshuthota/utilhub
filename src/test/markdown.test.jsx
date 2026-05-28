import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarkdownTool from '../app/tools/markdown/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea
            data-testid="code-editor"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
        />
    ),
}));

describe('MarkdownTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<MarkdownTool />);
        expect(screen.getByText('Markdown Viewer')).toBeInTheDocument();
    });

    it('renders markdown preview', () => {
        render(<MarkdownTool />);
        expect(screen.getByText('Welcome to Markdown Viewer')).toBeInTheDocument();
    });

    it('updates preview when markdown changes', () => {
        render(<MarkdownTool />);
        const editor = screen.getAllByTestId('code-editor')[0];
        fireEvent.change(editor, { target: { value: '# New Title' } });
        expect(screen.getByText('New Title')).toBeInTheDocument();
    });

    it('clears editor on clear button click', () => {
        render(<MarkdownTool />);
        fireEvent.click(screen.getByTitle('Clear'));
        const editor = screen.getAllByTestId('code-editor')[0];
        expect(editor).toHaveValue('');
    });
});
