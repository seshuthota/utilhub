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
        localStorage.clear();
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

    it('renders a resize handle in split view', () => {
        render(<MarkdownTool />);
        expect(screen.getByRole('separator', { name: /resize editor and preview/i })).toBeInTheDocument();
        expect(screen.getByTestId('markdown-split')).toHaveAttribute('data-view', 'split');
    });

    it('collapses the editor to preview-only', () => {
        render(<MarkdownTool />);
        fireEvent.click(screen.getByTitle('Preview only'));
        expect(screen.getByTestId('markdown-split')).toHaveAttribute('data-view', 'preview');
        expect(screen.getByTestId('code-editor')).not.toBeVisible();
        expect(screen.getByText('Welcome to Markdown Viewer')).toBeVisible();
        expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    });

    it('collapses the editor from the pane header', () => {
        render(<MarkdownTool />);
        fireEvent.click(screen.getByRole('button', { name: 'Collapse editor' }));
        expect(screen.getByTestId('markdown-split')).toHaveAttribute('data-view', 'preview');
        expect(screen.getByTitle('Show editor')).toBeInTheDocument();
    });

    it('restores split view from preview-only', () => {
        render(<MarkdownTool />);
        fireEvent.click(screen.getByTitle('Preview only'));
        fireEvent.click(screen.getByTitle('Split view'));
        expect(screen.getByTestId('markdown-split')).toHaveAttribute('data-view', 'split');
        expect(screen.getByTestId('code-editor')).toBeVisible();
        expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('switches to editor-only view', () => {
        render(<MarkdownTool />);
        fireEvent.click(screen.getByTitle('Editor only'));
        expect(screen.getByTestId('markdown-split')).toHaveAttribute('data-view', 'editor');
        expect(screen.getByTestId('code-editor')).toBeVisible();
        expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    });

    it('resizes panes when the gutter is dragged', () => {
        render(<MarkdownTool />);
        const gutter = screen.getByRole('separator');
        const split = screen.getByTestId('markdown-split');

        vi.spyOn(split, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 1000,
            height: 600,
            right: 1000,
            bottom: 600,
            x: 0,
            y: 0,
            toJSON: () => {},
        });

        fireEvent.pointerDown(gutter, { clientX: 500, clientY: 100, pointerId: 1 });
        fireEvent.pointerMove(gutter, { clientX: 300, clientY: 100, pointerId: 1 });
        fireEvent.pointerUp(gutter, { pointerId: 1 });

        expect(gutter).toHaveAttribute('aria-valuenow', '30');
        expect(split).toHaveStyle({ '--editor-size': '30%' });
    });

    it('resets the split on gutter double-click', () => {
        render(<MarkdownTool />);
        const gutter = screen.getByRole('separator');
        const split = screen.getByTestId('markdown-split');

        vi.spyOn(split, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 1000,
            height: 600,
            right: 1000,
            bottom: 600,
            x: 0,
            y: 0,
            toJSON: () => {},
        });

        fireEvent.pointerDown(gutter, { clientX: 500, clientY: 100, pointerId: 1 });
        fireEvent.pointerMove(gutter, { clientX: 250, clientY: 100, pointerId: 1 });
        fireEvent.pointerUp(gutter, { pointerId: 1 });
        fireEvent.doubleClick(gutter);

        expect(gutter).toHaveAttribute('aria-valuenow', '50');
        expect(split).toHaveAttribute('data-view', 'split');
    });
});
