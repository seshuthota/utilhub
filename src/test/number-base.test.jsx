
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NumberBaseTool from '../app/tools/number-base/page';

// Mock Toast and useUrlState
vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() })
}));

// We need to mock useUrlState to behave like useState for testing
vi.mock('@/hooks/useUrlState', () => {
    const React = require('react');
    return {
        useUrlState: (key, initial) => React.useState(initial)
    };
});

describe('NumberBaseTool', () => {
    it('converts Decimal to other bases', () => {
        render(<NumberBaseTool />);

        const decInput = screen.getByPlaceholderText('0-9');
        fireEvent.change(decInput, { target: { value: '10' } });

        expect(screen.getByPlaceholderText('0-1').value).toBe('1010'); // Binary
        expect(screen.getByPlaceholderText('0-7').value).toBe('12');    // Octal
        expect(screen.getByPlaceholderText('0-9, A-F').value).toBe('A');  // Hex
    });

    it('converts Hex to other bases', () => {
        render(<NumberBaseTool />);

        const hexInput = screen.getByPlaceholderText('0-9, A-F');
        fireEvent.change(hexInput, { target: { value: 'FF' } });

        expect(screen.getByPlaceholderText('0-9').value).toBe('255');   // Decimal
        expect(screen.getByPlaceholderText('0-1').value).toBe('11111111'); // Binary
        expect(screen.getByPlaceholderText('0-7').value).toBe('377');   // Octal
    });

    it('converts Binary to other bases', () => {
        render(<NumberBaseTool />);

        const binInput = screen.getByPlaceholderText('0-1');
        fireEvent.change(binInput, { target: { value: '101' } });

        expect(screen.getByPlaceholderText('0-9').value).toBe('5');     // Decimal
        expect(screen.getByPlaceholderText('0-9, A-F').value).toBe('5'); // Hex
        expect(screen.getByPlaceholderText('0-7').value).toBe('5');     // Octal
    });

    it('handles large numbers via BigInt', () => {
        render(<NumberBaseTool />);

        const decInput = screen.getByPlaceholderText('0-9');
        // Max Safe Integer + 1
        const largeNum = '9007199254740992';
        fireEvent.change(decInput, { target: { value: largeNum } });

        expect(screen.getByPlaceholderText('0-9, A-F').value).toBe('20000000000000');
    });
});
