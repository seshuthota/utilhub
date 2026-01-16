import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GraphqlSchemaTool from '../app/tools/graphql-schema/page';

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

const VALID_SDL = `type User { id: ID! name: String }`;

describe('GraphQL Schema Tool', () => {
    it('renders correctly', () => {
        render(<GraphqlSchemaTool />);
        expect(screen.getByText('GraphQL Schema Tool')).toBeDefined();
    });

    it('converts SDL to TypeScript', async () => {
        render(<GraphqlSchemaTool />);
        const input = screen.getByPlaceholderText('type Query { ... }');
        fireEvent.change(input, { target: { value: VALID_SDL } });

        await waitFor(() => {
            expect(screen.getByDisplayValue(/export interface User/)).toBeDefined();
            expect(screen.getByDisplayValue(/name\?: string;/)).toBeDefined();
        });
    });

    it('handles invalid SDL', async () => {
        render(<GraphqlSchemaTool />);
        const input = screen.getByPlaceholderText('type Query { ... }');
        fireEvent.change(input, { target: { value: 'type {' } });

        await waitFor(() => {
            expect(screen.getByText(/Syntax Error/)).toBeDefined();
        });
    });
});
