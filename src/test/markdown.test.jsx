import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MarkdownTool from '../app/tools/markdown/page';
import { encodeShare } from '@/utils/markdown';

const showToast = vi.fn();
vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast }),
}));

const downloadFile = vi.fn();
vi.mock('@/utils/download', () => ({
    downloadFile: (...args) => downloadFile(...args),
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

    it('strips script vectors from the rendered preview', () => {
        const { container } = render(<MarkdownTool />);
        const editor = screen.getAllByTestId('code-editor')[0];
        fireEvent.change(editor, {
            target: {
                value: '# Safe\n\n<img/src=x/onerror=alert(1)>\n\n<a href=javascript:alert(1)>link</a>\n\n<iframe srcdoc="<script>alert(1)</script>"></iframe>',
            },
        });
        expect(screen.getByText('Safe')).toBeInTheDocument();
        expect(container.querySelector('[onerror], iframe, script')).toBeNull();
        expect(screen.getByText('link').getAttribute('href')).toBeNull();
    });

    describe('documents, export and sharing', () => {
        beforeEach(() => {
            window.history.replaceState(null, '', '/tools/markdown');
            Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
        });

        const editor = () => screen.getAllByTestId('code-editor')[0];
        const type = (value) => fireEvent.change(editor(), { target: { value } });

        it('autosaves the draft and restores it on the next visit', async () => {
            const { unmount } = render(<MarkdownTool />);
            type('# My draft');
            await waitFor(() => expect(localStorage.getItem('utilhub_markdown_draft')).toBe('# My draft'), { timeout: 2000 });
            unmount();
            render(<MarkdownTool />);
            expect(editor()).toHaveValue('# My draft');
        });

        it('offers Undo after Clear and Example', () => {
            render(<MarkdownTool />);
            type('# Keep me');
            fireEvent.click(screen.getByTitle('Clear'));
            expect(editor()).toHaveValue('');
            fireEvent.click(screen.getByTitle('Undo'));
            expect(editor()).toHaveValue('# Keep me');

            fireEvent.click(screen.getByTitle('Load a full example'));
            expect(screen.getAllByRole('table').length).toBeGreaterThanOrEqual(2);
            expect(screen.getByText('Release notes', { selector: 'h1' })).toBeInTheDocument();
            fireEvent.click(screen.getByTitle('Undo'));
            expect(editor()).toHaveValue('# Keep me');
        });

        it('shows frontmatter as a metadata table and styles GFM task lists', () => {
            const { container } = render(<MarkdownTool />);
            type('---\nauthor: Ada\n---\n# Doc\n\n- [x] shipped');
            expect(container.querySelector('table.frontmatter')).toHaveTextContent('authorAda');
            expect(container.querySelector('input[type="checkbox"]')).toBeChecked();
        });

        it('copies Markdown and downloads .md / .html named after the title', async () => {
            render(<MarkdownTool />);
            type('# Release Notes\n\nBody');
            const open = () => fireEvent.click(screen.getByTitle('Copy or download'));

            open();
            fireEvent.click(screen.getByRole('menuitem', { name: /Copy Markdown/ }));
            await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('# Release Notes\n\nBody'));

            open();
            fireEvent.click(screen.getByRole('menuitem', { name: /Download \.md/ }));
            expect(downloadFile).toHaveBeenCalledWith('# Release Notes\n\nBody', 'release-notes.md', 'text/markdown');

            open();
            fireEvent.click(screen.getByRole('menuitem', { name: /Download \.html/ }));
            const [doc, name] = downloadFile.mock.calls.at(-1);
            expect(name).toBe('release-notes.html');
            expect(doc).toMatch(/^<!doctype html>/);
            expect(doc).toContain('<h1>Release Notes</h1>');
        });

        it('shows the generated HTML in HTML mode', () => {
            render(<MarkdownTool />);
            type('**hi**');
            fireEvent.click(screen.getByRole('button', { name: 'HTML' }));
            expect(screen.getAllByTestId('code-editor')[1].value).toContain('<strong>hi</strong>');
        });

        it('copies a share link that carries the document in the fragment', async () => {
            render(<MarkdownTool />);
            type('# Shared doc');
            fireEvent.click(screen.getByTitle('Copy a link containing this document'));
            await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
            const link = navigator.clipboard.writeText.mock.calls[0][0];
            expect(link).toMatch(/\/tools\/markdown#md=[zu]\./);
            expect(link).not.toContain('Shared');
        });

        it('opens a shared link without overwriting the saved draft', async () => {
            localStorage.setItem('utilhub_markdown_draft', '# My own draft');
            window.history.replaceState(null, '', `/tools/markdown#md=${await encodeShare('# From a friend')}`);
            render(<MarkdownTool />);
            await waitFor(() => expect(editor()).toHaveValue('# From a friend'));
            expect(window.location.hash).toBe('');
            await act(() => new Promise((r) => setTimeout(r, 500)));
            expect(localStorage.getItem('utilhub_markdown_draft')).toBe('# My own draft');
            fireEvent.click(screen.getByText('Restore my draft'));
            expect(editor()).toHaveValue('# My own draft');
        });

        it('opens .md files and rejects other types', async () => {
            render(<MarkdownTool />);
            const input = screen.getByLabelText('Open Markdown file');
            const md = new File(['# From disk'], 'notes.md', { type: 'text/markdown' });
            fireEvent.change(input, { target: { files: [md] } });
            await waitFor(() => expect(editor()).toHaveValue('# From disk'));
            const png = new File(['x'], 'pic.png', { type: 'image/png' });
            fireEvent.change(input, { target: { files: [png] } });
            await waitFor(() => expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/Open a Markdown/), 'error'));
            expect(editor()).toHaveValue('# From disk');
        });

        it('has a formatting toolbar', () => {
            render(<MarkdownTool />);
            const toolbar = screen.getByRole('toolbar', { name: 'Formatting' });
            ['Bold', 'Italic', 'Link', 'Table', 'Task list', 'Code block'].forEach((label) =>
                expect(toolbar.querySelector(`[aria-label="${label}"]`)).not.toBeNull());
        });
    });
});
