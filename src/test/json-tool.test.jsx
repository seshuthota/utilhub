import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JsonTool from '../app/tools/json/page';
import * as useHistoryHook from '../hooks/useHistory';

// Mock dependencies
vi.mock('../components/common/CodeEditor', () => ({
    default: ({ value, onChange }) => (
        <textarea
            data-testid="code-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}));

vi.mock('../components/common/AiAssistButton', () => ({
    default: () => <button>AI Assist</button>
}));

const mockSearchParams = {
    get: vi.fn().mockReturnValue(null),
    entries: () => [],
    toString: () => '',
};

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => mockSearchParams,
    usePathname: () => '/tools/json',
}));

describe('JsonTool', () => {
    let addToHistoryMock;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        addToHistoryMock = vi.fn();
        vi.spyOn(useHistoryHook, 'useHistory').mockReturnValue({
            history: [],
            addToHistory: addToHistoryMock,
            clearHistory: vi.fn(),
            removeFromHistory: vi.fn()
        });
    });

    it('renders with default value', () => {
        render(<JsonTool />);
        expect(screen.getByText('JSON Formatter')).toBeDefined();
        expect(screen.getByTestId('code-editor')).toBeDefined();
    });

    it('formats valid JSON', async () => {
        render(<JsonTool />);
        const editor = screen.getByTestId('code-editor');

        // Input unformatted JSON
        fireEvent.change(editor, { target: { value: '{"foo":"bar"}' } });

        // Click Format
        const formatBtn = screen.getByTitle('Format (Cmd/Ctrl + Enter)');
        fireEvent.click(formatBtn);

        // Expect formatted output
        await waitFor(() => {
            expect(editor.value).toContain('{\n  "foo": "bar"\n}');
        });

        // Expect history update
        expect(addToHistoryMock).toHaveBeenCalledWith(expect.objectContaining({
            type: 'Format'
        }));
    });

    it('minifies valid JSON', async () => {
        render(<JsonTool />);
        const editor = screen.getByTestId('code-editor');

        // Input formatted JSON
        fireEvent.change(editor, { target: { value: '{\n  "foo": "bar"\n}' } });

        // Click Minify
        const minifyBtn = screen.getByTitle('Minify');
        fireEvent.click(minifyBtn);

        // Expect minified output
        await waitFor(() => {
            expect(editor.value).toBe('{"foo":"bar"}');
        });

        // Expect history update
        expect(addToHistoryMock).toHaveBeenCalledWith(expect.objectContaining({
            type: 'Minify'
        }));
    });

    it('handles invalid JSON', () => {
        render(<JsonTool />);
        const editor = screen.getByTestId('code-editor');

        // Input invalid JSON
        fireEvent.change(editor, { target: { value: '{foo:bar}' } });

        // Click Format
        const formatBtn = screen.getByTitle('Format (Cmd/Ctrl + Enter)');
        fireEvent.click(formatBtn);

        // Expect error message (mock toast or alert check - here just ensuring code didn't change)
        expect(editor.value).toBe('{foo:bar}');
        expect(addToHistoryMock).not.toHaveBeenCalled();
    });
});
