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
    default: ({ value, onChange, placeholder, readOnly }) => (
        <textarea
            data-testid={readOnly ? "output-editor" : "input-editor"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            readOnly={readOnly}
        />
    )
}));

const VALID_SDL = `
type Query {
  user: User
}
type User { id: ID! name: String }
`;

const COMPLEX_SDL = `
scalar Date

enum Role {
  ADMIN
  USER
}

input CreateUserInput {
  username: String!
  role: Role
}
`;

describe('GraphQL Schema Tool', () => {
    it('renders correctly', () => {
        render(<GraphqlSchemaTool />);
        expect(screen.getByText('GraphQL Schema Tool')).toBeDefined();
    });

    it('converts SDL to TypeScript', async () => {
        render(<GraphqlSchemaTool />);
        const input = screen.getByTestId('input-editor');
        fireEvent.change(input, { target: { value: VALID_SDL } });

        await waitFor(() => {
            const output = screen.getByTestId('output-editor');
            expect(output.value).toContain('export interface User');
            expect(output.value).toContain('name?: string;');
        });
    });

    it('converts complex SDL (Scalars, Enums, Inputs) to TypeScript', async () => {
        render(<GraphqlSchemaTool />);
        const input = screen.getByTestId('input-editor');
        fireEvent.change(input, { target: { value: COMPLEX_SDL } });

        await waitFor(() => {
            const output = screen.getByTestId('output-editor');
            
            // Scalar
            expect(output.value).toContain('export type Date = any;');
            
            // Enum
            expect(output.value).toContain('export enum Role {');
            expect(output.value).toContain('ADMIN = "ADMIN"');
            
            // Input
            expect(output.value).toContain('export interface CreateUserInput {');
            expect(output.value).toContain('username: string;'); // Required
            expect(output.value).toContain('role?: Role;'); // Optional
        });
    });

    it('handles JSON/Introspection mode', async () => {
        render(<GraphqlSchemaTool />);
        const input = screen.getByTestId('input-editor');
        fireEvent.change(input, { target: { value: VALID_SDL } });

        // Switch to JSON mode
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'json' } });

        await waitFor(() => {
            const output = screen.getByTestId('output-editor');
            expect(output.value).toContain('"__schema"'); // Introspection result
            expect(output.value).toContain('"types"');
        });
    });

    it('handles invalid SDL', async () => {
        render(<GraphqlSchemaTool />);
        const input = screen.getByTestId('input-editor');
        fireEvent.change(input, { target: { value: 'type {' } });

        await waitFor(() => {
            expect(screen.getByText(/Syntax Error/)).toBeDefined();
        });
    });
});
