import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UrlTool from '../app/tools/url/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

describe('UrlTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<UrlTool />);
        expect(screen.getByText('URL Encoder/Decoder')).toBeInTheDocument();
    });

    it('encodes a URL', () => {
        render(<UrlTool />);
        const input = screen.getByPlaceholderText('Paste URL to encode...');
        fireEvent.change(input, { target: { value: 'hello world' } });
        const output = screen.getByPlaceholderText('Result will appear here...');
        expect(output).toHaveValue('hello%20world');
    });

    it('decodes a URL-encoded string', () => {
        render(<UrlTool />);
        const switchBtn = screen.getByTitle('Switch Mode');
        fireEvent.click(switchBtn);
        const input = screen.getByPlaceholderText('Paste URL to decode...');
        fireEvent.change(input, { target: { value: 'hello%20world' } });
        const output = screen.getByPlaceholderText('Result will appear here...');
        expect(output).toHaveValue('hello world');
    });

    it('swaps input and output on mode toggle', () => {
        render(<UrlTool />);
        const input = screen.getByPlaceholderText('Paste URL to encode...');
        fireEvent.change(input, { target: { value: 'test' } });
        const switchBtn = screen.getByTitle('Switch Mode');
        fireEvent.click(switchBtn);
        const output = screen.getByPlaceholderText('Result will appear here...');
        expect(screen.getByPlaceholderText('Paste URL to decode...')).toHaveValue('test');
    });

    it('shows error for invalid URI', () => {
        render(<UrlTool />);
        const switchBtn = screen.getByTitle('Switch Mode');
        fireEvent.click(switchBtn);
        const input = screen.getByPlaceholderText('Paste URL to decode...');
        fireEvent.change(input, { target: { value: '%' } });
        const output = screen.getByPlaceholderText('Result will appear here...');
        expect(output).toHaveValue('Error: Invalid URI');
    });
});
