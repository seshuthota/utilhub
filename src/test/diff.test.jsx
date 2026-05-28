import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DiffTool from '../app/tools/diff/page';

vi.mock('@/hooks/useInputSize', () => ({
    useInputSize: () => ({
        setInput: vi.fn(),
        startProcessing: vi.fn(),
        finishProcessing: vi.fn(),
        isProcessing: false,
        status: 'idle',
    }),
}));

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/workers/diff.worker.js?raw', () => ({
    default: '',
}));

vi.mock('@/hooks/useWorker', () => ({
    useWorker: () => ({
        execute: vi.fn(),
        isReady: false,
        terminate: vi.fn(),
        clearQueue: vi.fn(),
    }),
}));

describe('DiffTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<DiffTool />);
        expect(screen.getByText('Diff Checker')).toBeInTheDocument();
    });

    it('computes diff for different texts', () => {
        render(<DiffTool />);
        const oldInput = screen.getByPlaceholderText('Paste original text here...');
        const newInput = screen.getByPlaceholderText('Paste new text here...');
        fireEvent.change(oldInput, { target: { value: 'aaa\nbbb' } });
        fireEvent.change(newInput, { target: { value: 'aaa\nccc' } });
        fireEvent.click(screen.getByText('Compute Diff'));
        const results = screen.getAllByText(/aaa|bbb|ccc/);
        expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('shows diff result for completely different texts', () => {
        render(<DiffTool />);
        const oldInput = screen.getByPlaceholderText('Paste original text here...');
        const newInput = screen.getByPlaceholderText('Paste new text here...');
        fireEvent.change(oldInput, { target: { value: 'old' } });
        fireEvent.change(newInput, { target: { value: 'new' } });
        fireEvent.click(screen.getByText('Compute Diff'));
        const results = screen.getAllByText(/old|new/);
        expect(results.length).toBeGreaterThanOrEqual(2);
    });
});
