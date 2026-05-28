import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JwtTool from '../app/tools/jwt/page';

const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, defaultValue) => {
        const [val, setVal] = require('react').useState(defaultValue || '');
        return [val, setVal];
    },
}));

vi.mock('@/hooks/useHotkeys', () => ({
    useHotkeys: vi.fn(),
}));

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange }) => (
        <textarea data-testid="code-editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} />
    ),
}));

vi.mock('@/components/common/ActionToolbar', () => ({
    default: () => null,
}));

describe('JwtTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<JwtTool />);
        expect(screen.getByText('JWT Tool')).toBeInTheDocument();
    });

    it('shows decode tab by default', () => {
        render(<JwtTool />);
        expect(screen.getByText('Decoder')).toBeInTheDocument();
    });

    it('accepts JWT token input', () => {
        render(<JwtTool />);
        const textarea = screen.getByPlaceholderText('Paste your JWT here (eyJ...)');
        fireEvent.change(textarea, { target: { value: validToken } });
        expect(textarea).toHaveValue(validToken);
    });

    it('switches to signer tab', () => {
        render(<JwtTool />);
        fireEvent.click(screen.getByText('Signer'));
        expect(screen.getByText('Secret Key')).toBeInTheDocument();
        expect(screen.getByText('Sign Token')).toBeInTheDocument();
    });
});
