import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DiffTool from '../app/tools/diff/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

describe('DiffTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(navigator, {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
    });

    it('renders correctly', () => {
        render(<DiffTool />);
        expect(screen.getByText('Diff Checker')).toBeInTheDocument();
    });

    it('shows live stats for default sample', async () => {
        render(<DiffTool />);
        await waitFor(() => {
            expect(screen.getByText(/added/)).toBeInTheDocument();
        });
    });

    it('computes live diff when text changes', async () => {
        render(<DiffTool />);
        fireEvent.change(screen.getByLabelText('Original text'), {
            target: { value: 'aaa\nbbb' },
        });
        fireEvent.change(screen.getByLabelText('Changed text'), {
            target: { value: 'aaa\nccc' },
        });
        await waitFor(() => {
            expect(screen.getAllByText(/aaa/).length).toBeGreaterThanOrEqual(1);
        });
    });

    it('has granularity and view controls', () => {
        render(<DiffTool />);
        expect(screen.getByText('Lines')).toBeInTheDocument();
        expect(screen.getByText('Words')).toBeInTheDocument();
        expect(screen.getByText('Chars')).toBeInTheDocument();
        expect(screen.getByText('Split')).toBeInTheDocument();
        expect(screen.getByText('Unified')).toBeInTheDocument();
    });

    it('switches to unified view', async () => {
        render(<DiffTool />);
        fireEvent.click(screen.getByText('Unified'));
        expect(screen.getByLabelText('Unified diff')).toBeInTheDocument();
    });

    it('copies a unified patch', async () => {
        render(<DiffTool />);
        fireEvent.click(screen.getByText('Patch'));
        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
        const patch = navigator.clipboard.writeText.mock.calls[0][0];
        expect(patch).toContain('--- original');
    });

    it('shows find difference when live is off', () => {
        render(<DiffTool />);
        fireEvent.click(screen.getByLabelText ? screen.getByText('Live').previousSibling || screen.getByText('Live') : screen.getByText('Live'));
        const live = screen.getByText('Live').closest('label');
        const checkbox = live.querySelector('input[type="checkbox"]');
        fireEvent.click(checkbox);
        expect(screen.getByText('Find difference')).toBeInTheDocument();
    });
});
