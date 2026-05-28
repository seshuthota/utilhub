import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Base64Tool from '../app/tools/base64/page';

vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, defaultValue) => {
        const [val, setVal] = require('react').useState(defaultValue);
        return [val, setVal];
    },
}));

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/common/ActionToolbar', () => ({
    default: () => null,
}));

describe('Base64Tool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<Base64Tool />);
        expect(screen.getByText('Base64 Converter')).toBeInTheDocument();
    });

    it('encodes text to base64', () => {
        render(<Base64Tool />);
        const input = screen.getByPlaceholderText('Type text to encode...');
        fireEvent.change(input, { target: { value: 'hello' } });
        const output = screen.getByPlaceholderText('Result will appear here...');
        expect(output).toHaveValue('aGVsbG8=');
    });

    it('switches mode and decodes base64', () => {
        render(<Base64Tool />);
        const switchBtn = screen.getByTitle('Switch Mode');
        fireEvent.click(switchBtn);
        const input = screen.getByPlaceholderText('Paste Base64 to decode...');
        fireEvent.change(input, { target: { value: 'aGVsbG8=' } });
        const output = screen.getByPlaceholderText('Result will appear here...');
        expect(output).toHaveValue('hello');
    });

    it('switches mode and preserves decoded value', () => {
        render(<Base64Tool />);
        const switchBtn = screen.getByTitle('Switch Mode');
        fireEvent.click(switchBtn);
        const output = screen.getByPlaceholderText('Result will appear here...');
        expect(output).toHaveValue('Hello UtilHub');
    });

    it('clears input and output on clear', () => {
        render(<Base64Tool />);
        const clearBtn = screen.getByTitle('Clear');
        fireEvent.click(clearBtn);
        const input = screen.getByPlaceholderText('Type text to encode...');
        expect(input).toHaveValue('');
    });
});
