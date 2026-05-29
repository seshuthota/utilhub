import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CurlTester from '../app/tools/curl-tester/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder, readOnly }) => (
        <textarea
            data-testid="code-editor"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
        />
    ),
}));

global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' },
        data: { id: 1 },
        time: 145,
    }),
});

describe('CurlTester', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<CurlTester />);
        expect(screen.getByText('API Client')).toBeInTheDocument();
    });

    it('loads example request by default', () => {
        render(<CurlTester />);
        expect(screen.getByDisplayValue('POST')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/jsonplaceholder/)).toBeInTheDocument();
    });

    it('shows tabs for params, headers, auth, body', () => {
        render(<CurlTester />);
        expect(screen.getByText(/Params/)).toBeInTheDocument();
        expect(screen.getByText(/Headers/)).toBeInTheDocument();
        expect(screen.getByText(/Auth/)).toBeInTheDocument();
        expect(screen.getByText(/Body/)).toBeInTheDocument();
    });

    it('sends request to proxy endpoint', async () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Send'));
        await waitFor(() => {
            expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
                '/api/tester/proxy',
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    it('shows response metadata after send', async () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Send'));
        await waitFor(() => {
            expect(screen.getByText(/Created/)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('clears form on clear', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByTitle('Clear all'));
        const urlInput = screen.getByPlaceholderText('https://api.example.com/data');
        expect(urlInput).toHaveValue('');
    });

    it('opens and closes curl import modal', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('curl'));
        expect(screen.getByText('Import from cURL')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('Import from cURL')).not.toBeInTheDocument();
    });

    it('imports curl command to fill request', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('curl'));
        const editors = screen.getAllByTestId('code-editor');
        const curlEditor = editors.find(e => e.getAttribute('placeholder')?.includes('curl'));
        if (!curlEditor) { throw new Error('curl editor not found'); }
        fireEvent.change(curlEditor, {
            target: { value: "curl https://api.example.com/data -H 'Authorization: Bearer xyz'" },
        });
        fireEvent.click(screen.getByText('Import'));
        expect(screen.getByDisplayValue(/api.example.com/)).toBeInTheDocument();
    });

    it('shows auth tab with Bearer token option', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Auth'));
        expect(screen.getByText('No Auth')).toBeInTheDocument();
        const selects = screen.getAllByRole('combobox');
        const authSelect = selects[selects.length - 1];
        fireEvent.change(authSelect, { target: { value: 'bearer' } });
        expect(screen.getByPlaceholderText('eyJhbGciOiJIUzI1NiIs...')).toBeInTheDocument();
    });

    it('shows error when sending with empty URL', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByTitle('Clear all'));
        fireEvent.click(screen.getByText('Send'));
        expect(vi.mocked(global.fetch)).not.toHaveBeenCalled();
    });
});
