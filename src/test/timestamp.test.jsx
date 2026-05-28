import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimestampTool from '../app/tools/timestamp/page';

vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, defaultValue) => {
        const [val, setVal] = require('react').useState(defaultValue || '');
        return [val, setVal];
    },
}));

describe('TimestampTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<TimestampTool />);
        expect(screen.getByText('Timestamp Converter')).toBeInTheDocument();
    });

    it('shows converter and formats sections', () => {
        render(<TimestampTool />);
        expect(screen.getByText('Converter')).toBeInTheDocument();
        expect(screen.getByText('Formats')).toBeInTheDocument();
    });

    it('updates date when unix input changes', () => {
        render(<TimestampTool />);
        const unixInput = screen.getByRole('spinbutton');
        fireEvent.change(unixInput, { target: { value: '1700000000' } });
        expect(screen.getByText(/UTC/i)).toBeInTheDocument();
    });
});
