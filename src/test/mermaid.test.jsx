import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import mermaid from 'mermaid';
import MermaidTool from '../app/tools/mermaid/page';

vi.mock('mermaid', () => ({
    default: {
        initialize: vi.fn(),
        render: vi.fn(),
    },
}));

vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, defaultValue) => {
        const [val, setVal] = require('react').useState(defaultValue);
        return [val, setVal];
    },
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea data-testid="code-editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} />
    ),
}));

vi.mock('@/components/common/AiAssistBar', () => ({
    default: () => null,
}));

vi.mock('@/components/common/AiDisclaimer', () => ({
    default: () => null,
}));

vi.mock('@/components/common/ActionToolbar', () => ({
    default: () => null,
}));

describe('MermaidTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mermaid.render.mockResolvedValue({
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>',
        });
        document.documentElement.removeAttribute('data-theme');
    });

    it('renders correctly', () => {
        render(<MermaidTool />);
        expect(screen.getByText('Mermaid Chart')).toBeInTheDocument();
    });

    it('shows action buttons', () => {
        render(<MermaidTool />);
        expect(screen.getByText('Download')).toBeInTheDocument();
        expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('clears editor on clear', () => {
        render(<MermaidTool />);
        fireEvent.click(screen.getByText('Clear'));
        const editor = screen.getAllByTestId('code-editor')[0];
        expect(editor).toHaveValue('');
    });

    it('initializes mermaid with securityLevel strict and no startOnLoad', async () => {
        render(<MermaidTool />);
        await waitFor(() => expect(mermaid.render).toHaveBeenCalled(), { timeout: 2000 });
        for (const [config] of mermaid.initialize.mock.calls) {
            expect(config.securityLevel).toBe('strict');
            expect(config.startOnLoad).not.toBe(true);
        }
        expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ securityLevel: 'strict' }));
    });

    it('renders the diagram as an <img> rather than inline SVG', async () => {
        mermaid.render.mockResolvedValue({
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert(1)"><a href="javascript:alert(1)"><text>x</text></a></svg>',
        });
        const { container } = render(<MermaidTool />);
        const img = await screen.findByAltText('Mermaid diagram preview', {}, { timeout: 2000 });
        expect(img.getAttribute('src')).toMatch(/^(blob:|data:image\/svg\+xml)/);
        expect(container.querySelector('svg[onload], svg a')).toBeNull();
        expect(screen.getByText('Download').closest('button')).not.toBeDisabled();
    });

    it('uses a unique render id each time', async () => {
        render(<MermaidTool />);
        await waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(1), { timeout: 2000 });
        fireEvent.change(screen.getByTestId('code-editor'), { target: { value: 'graph LR\n A --> B' } });
        await waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(2), { timeout: 2000 });
        const [first, second] = mermaid.render.mock.calls.map(([id]) => id);
        expect(first).not.toBe('mermaid-svg');
        expect(first).not.toBe(second);
    });

    it('shows mermaid\'s error message and removes leftover error nodes', async () => {
        mermaid.render.mockImplementation(async (id) => {
            const leftover = document.createElement('div');
            leftover.id = `d${id}`;
            document.body.appendChild(leftover);
            throw new Error('Parse error on line 2:\n...B -->\nExpecting \'NODE_STRING\', got \'EOF\'');
        });
        render(<MermaidTool />);
        const alert = await screen.findByRole('alert', {}, { timeout: 2000 });
        expect(alert).toHaveTextContent('Parse error on line 2');
        expect(alert).not.toHaveTextContent('Invalid Syntax');
        const [id] = mermaid.render.mock.calls[0];
        expect(document.getElementById(`d${id}`)).toBeNull();
    });

    it('disables Download when there is no SVG', async () => {
        mermaid.render.mockRejectedValue(new Error('No diagram type detected'));
        render(<MermaidTool />);
        await screen.findByRole('alert', {}, { timeout: 2000 });
        expect(screen.getByText('Download').closest('button')).toBeDisabled();
    });

    it('follows the app theme and re-renders when it changes', async () => {
        document.documentElement.setAttribute('data-theme', 'light');
        render(<MermaidTool />);
        await waitFor(
            () => expect(mermaid.initialize).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'default' })),
            { timeout: 2000 },
        );
        const renders = mermaid.render.mock.calls.length;

        document.documentElement.setAttribute('data-theme', 'dracula');
        await waitFor(
            () => expect(mermaid.initialize).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'dark' })),
            { timeout: 2000 },
        );
        expect(mermaid.render.mock.calls.length).toBeGreaterThan(renders);
    });
});
