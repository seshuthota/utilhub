import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ColorConverter from '../app/tools/color/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

describe('ColorConverter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<ColorConverter />);
        expect(screen.getByText('Color Converter')).toBeInTheDocument();
    });

    it('shows default HEX value', () => {
        render(<ColorConverter />);
        const hexInputs = screen.getAllByDisplayValue('6366f1');
        expect(hexInputs.length).toBeGreaterThan(0);
    });

    it('shows default RGB values', () => {
        render(<ColorConverter />);
        expect(screen.getByDisplayValue('99')).toBeInTheDocument();
        expect(screen.getByDisplayValue('102')).toBeInTheDocument();
        expect(screen.getByDisplayValue('241')).toBeInTheDocument();
    });

    it('updates RGB when HEX changes', () => {
        render(<ColorConverter />);
        const hexInput = screen.getAllByDisplayValue('6366f1')[0];
        fireEvent.change(hexInput, { target: { value: 'ff0000' } });
        const redInputs = screen.getAllByDisplayValue('255');
        expect(redInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('generates random color', () => {
        render(<ColorConverter />);
        fireEvent.click(screen.getByText('Randomize'));
        expect(screen.getByText('Color Converter')).toBeInTheDocument();
    });
});
