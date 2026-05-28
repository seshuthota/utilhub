import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CurlTester from '../app/tools/curl-tester/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' },
        data: { id: 1, title: 'foo', body: 'bar', userId: 1 },
        time: 145,
    }),
});

describe('CurlTester', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<CurlTester />);
        expect(screen.getByText('Curl Tester')).toBeInTheDocument();
    });

    it('shows example curl by default', () => {
        render(<CurlTester />);
        const textarea = screen.getByPlaceholderText('Paste a cURL command here...');
        expect(textarea.textContent).toContain('jsonplaceholder');
    });

    it('parses curl command on parse click', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Parse'));
        expect(screen.getByText('POST')).toBeInTheDocument();
        expect(screen.getByText('Method')).toBeInTheDocument();
    });

    it('shows error for invalid curl', () => {
        render(<CurlTester />);
        const textarea = screen.getByPlaceholderText('Paste a cURL command here...');
        fireEvent.change(textarea, { target: { value: 'not a curl' } });
        fireEvent.click(screen.getByText('Parse'));
        expect(screen.getByText(/must start with/i)).toBeInTheDocument();
    });

    it('clears input on clear', () => {
        render(<CurlTester />);
        const clearBtn = screen.getByTitle('Clear');
        fireEvent.click(clearBtn);
        const textarea = screen.getByPlaceholderText('Paste a cURL command here...');
        expect(textarea.textContent).toBe('');
    });
});
