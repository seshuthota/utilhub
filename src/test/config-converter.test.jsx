import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfigConverter from '../app/tools/converter/page';

// Mock matchMedia
window.matchMedia = window.matchMedia || function () {
    return { matches: false, addListener: () => { }, removeListener: () => { } };
};

// Mock URL state
vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, def) => {
        const React = require('react');
        return React.useState(def);
    }
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
    usePathname: () => '',
}));

// Mock CodeEditor
vi.mock('@/components/common/CodeEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}));

const JSON_INPUT = `{"key": "value"}`;

describe('Config Converter', () => {
    it('renders correctly', () => {
        render(<ConfigConverter />);
        expect(screen.getByText('Config Converter')).toBeDefined();
    });

    it('converts JSON to YAML (default)', async () => {
        render(<ConfigConverter />);
        const input = screen.getByPlaceholderText('Paste JSON here...');
        fireEvent.change(input, { target: { value: JSON_INPUT } });

        await waitFor(() => {
            expect(screen.getByDisplayValue(/key: value/)).toBeDefined();
        });
    });

    it('shows error for malformed input', async () => {
        render(<ConfigConverter />);
        const input = screen.getByPlaceholderText('Paste JSON here...');
        fireEvent.change(input, { target: { value: '{invalid' } });

        await waitFor(() => {
            expect(screen.getByText(/Error parsing JSON/)).toBeDefined();
        });
    });
});
