import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JwtTool from '../app/tools/jwt/page';

// HS256 with secret "secret" (Web Crypto HMAC-SHA256)
const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.XbPfbIHMI6arZ3Y922BhjWgQzWXcXNrz0ogtVhfEd2o';

const showToast = vi.fn();

vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (_key, defaultValue) => {
        const React = require('react');
        return React.useState(defaultValue || '');
    },
}));

vi.mock('@/hooks/useHotkeys', () => ({
    useHotkeys: vi.fn(),
}));

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast }),
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange }) => (
        <textarea
            data-testid="code-editor"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
        />
    ),
}));

vi.mock('@/components/common/ActionToolbar', () => ({
    default: () => null,
}));

vi.mock('@/components/common/ShareButton', () => ({
    default: () => null,
}));

describe('JwtTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(navigator, {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
    });

    it('renders correctly', () => {
        render(<JwtTool />);
        expect(screen.getByText('JWT Tool')).toBeInTheDocument();
    });

    it('shows decode tab by default', () => {
        render(<JwtTool />);
        expect(screen.getByText('Decoder')).toBeInTheDocument();
    });

    it('decodes JWT and shows payload fields', async () => {
        render(<JwtTool />);
        const textarea = screen.getByLabelText('JWT token');
        fireEvent.change(textarea, { target: { value: validToken } });
        await waitFor(() => {
            expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        });
        expect(screen.getAllByText(/1234567890/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/"alg": "HS256"/)).toBeInTheDocument();
    });

    it('shows Not verified without secret', async () => {
        render(<JwtTool />);
        fireEvent.change(screen.getByLabelText('JWT token'), {
            target: { value: validToken },
        });
        await waitFor(() => {
            expect(screen.getByText('Not verified')).toBeInTheDocument();
        });
    });

    it('verifies signature with correct secret', async () => {
        render(<JwtTool />);
        fireEvent.change(screen.getByLabelText('JWT token'), {
            target: { value: validToken },
        });
        fireEvent.change(screen.getByLabelText('HMAC secret for verification'), {
            target: { value: 'secret' },
        });
        await waitFor(() => {
            expect(screen.getByText('Signature valid')).toBeInTheDocument();
        });
    });

    it('shows invalid signature with wrong secret', async () => {
        render(<JwtTool />);
        fireEvent.change(screen.getByLabelText('JWT token'), {
            target: { value: validToken },
        });
        fireEvent.change(screen.getByLabelText('HMAC secret for verification'), {
            target: { value: 'wrong-secret' },
        });
        await waitFor(() => {
            expect(screen.getByText('Signature invalid')).toBeInTheDocument();
        });
    });

    it('shows time claims when iat present', async () => {
        render(<JwtTool />);
        fireEvent.change(screen.getByLabelText('JWT token'), {
            target: { value: validToken },
        });
        await waitFor(() => {
            expect(screen.getByText('Time claims')).toBeInTheDocument();
            expect(screen.getByText(/Issued at \(iat\)/)).toBeInTheDocument();
        });
    });

    it('copies Bearer header', async () => {
        render(<JwtTool />);
        fireEvent.change(screen.getByLabelText('JWT token'), {
            target: { value: validToken },
        });
        fireEvent.click(screen.getByText('Copy Bearer'));
        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                `Authorization: Bearer ${validToken}`,
            );
        });
    });

    it('switches to signer tab', () => {
        render(<JwtTool />);
        fireEvent.click(screen.getByText('Signer'));
        expect(screen.getByText('Secret Key')).toBeInTheDocument();
        expect(screen.getByText('Sign Token')).toBeInTheDocument();
    });

    it('signs a token and shows output', async () => {
        render(<JwtTool />);
        fireEvent.click(screen.getByText('Signer'));
        fireEvent.change(screen.getByLabelText('HMAC secret for signing'), {
            target: { value: 'test-secret' },
        });
        fireEvent.click(screen.getByText('Sign Token'));
        await waitFor(() => {
            const output = screen.getByLabelText('Signed JWT output');
            expect(output.value.split('.')).toHaveLength(3);
            expect(output.value.length).toBeGreaterThan(20);
        });
        expect(showToast).toHaveBeenCalledWith('Token signed successfully', 'success');
    });
});
