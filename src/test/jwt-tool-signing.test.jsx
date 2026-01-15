
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JwtTool from '../app/tools/jwt/page';

// Mock CodeEditor 
vi.mock('@/components/common/CodeEditor', () => ({
    default: ({ value, onChange }) => (
        <textarea
            data-testid="code-editor"
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    )
}));

// Mock Toast and useUrlState
vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() })
}));
vi.mock('@/hooks/useUrlState', () => {
    const React = require('react');
    return {
        useUrlState: (key, initial) => React.useState(initial)
    };
});

// Mock jwt utility to avoid Web Crypto dependency in tests
vi.mock('@/utils/jwt', async () => {
    const actual = await vi.importActual('@/utils/jwt');
    return {
        ...actual,
        signJwt: vi.fn((header, payload, secret) => Promise.resolve('mock.signed.token')),
        decodeJwt: vi.fn(() => ({ header: null, payload: null, error: null }))
    };
});

import { signJwt } from '@/utils/jwt';

describe('JwtTool', () => {
    it('switches to Signer tab and signs token', async () => {
        render(<JwtTool />);

        // Click Signer Tab
        const signTab = screen.getByText('Signer');
        fireEvent.click(signTab);

        // Find Inputs
        // There are two CodeEditors (Header, Payload) and one Secret Input
        const editors = screen.getAllByTestId('code-editor');
        const headerEditor = editors[0];
        const payloadEditor = editors[1];
        const secretInput = screen.getByPlaceholderText('Enter secret to sign...');

        // Change inputs
        fireEvent.change(headerEditor, { target: { value: '{"alg":"HS256"}' } });
        fireEvent.change(payloadEditor, { target: { value: '{"sub":"test"}' } });
        fireEvent.change(secretInput, { target: { value: 'mysecret' } });

        // Click Sign
        const signBtn = screen.getByText('Sign Token');
        fireEvent.click(signBtn);

        // Verify signJwt call and output
        await waitFor(() => {
            expect(signJwt).toHaveBeenCalledWith(
                { alg: "HS256" },
                { sub: "test" },
                "mysecret"
            );
        });

        expect(screen.getByDisplayValue('mock.signed.token')).toBeInTheDocument();
    });
});
