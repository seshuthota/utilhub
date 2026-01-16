import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SvgOptimizer from '../app/tools/svg/page';

// Mock svgo/browser
vi.mock('svgo/browser', () => ({
    optimize: vi.fn((input, config) => {
        if (input.includes('error')) throw new Error('Optimization failed');
        return { data: input.replace('<svg', '<svg optimized="true"') };
    }),
}));

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

// Mock Toast
vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() })
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

describe('SVG Optimizer', () => {
    it('renders correctly', () => {
        render(<SvgOptimizer />);
        expect(screen.getByText('SVG Optimizer')).toBeDefined();
        expect(screen.getByPlaceholderText(/Paste SVG code here/)).toBeDefined();
    });

    it('optimizes input SVG', async () => {
        render(<SvgOptimizer />);
        const input = screen.getByPlaceholderText(/Paste SVG code here/);
        fireEvent.change(input, { target: { value: '<svg>test</svg>' } });

        await waitFor(() => {
            expect(screen.getByText('Original:')).toBeDefined();
            // Check for size (15 B or 0 B depending on JSDOM Blob support)
            expect(screen.getAllByText(/\d+ B/)[0]).toBeDefined();
        });
    });

    it('handles optimization errors', async () => {
        render(<SvgOptimizer />);
        const input = screen.getByPlaceholderText(/Paste SVG code here/);
        fireEvent.change(input, { target: { value: '<svg>error</svg>' } });

        await waitFor(() => {
            expect(screen.getByText(/Optimization failed/i)).toBeDefined();
        });
    });
});
