import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BeautifyTool from '../app/tools/beautify/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/hooks/useInputSize', () => ({
    useInputSize: () => ({
        setInput: vi.fn(),
        startProcessing: vi.fn(),
        finishProcessing: vi.fn(),
        isProcessing: false,
        status: 'idle',
        estimatedTime: null,
    }),
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea data-testid="code-editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} />
    ),
}));

describe('BeautifyTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<BeautifyTool />);
        expect(screen.getByText('Code Beautifier')).toBeInTheDocument();
    });

    it('shows language selector', () => {
        render(<BeautifyTool />);
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('shows beautify and minify buttons', () => {
        render(<BeautifyTool />);
        expect(screen.getByText('Beautify')).toBeInTheDocument();
        expect(screen.getByText('Minify')).toBeInTheDocument();
        expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('changes language on select', () => {
        render(<BeautifyTool />);
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'json' } });
        const placeholder = screen.getByPlaceholderText(/paste your/i);
        expect(placeholder).toBeInTheDocument();
    });
});
