import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QrTool from '../app/tools/qrcode/page';

vi.mock('html5-qrcode', () => {
    const mockScanner = vi.fn().mockImplementation(function() {
        this.render = vi.fn();
        this.clear = vi.fn().mockResolvedValue(undefined);
    });
    return { Html5QrcodeScanner: mockScanner };
});

describe('QrTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<QrTool />);
        expect(screen.getByText('QR Code Tool')).toBeInTheDocument();
    });

    it('shows QR code generate mode by default', () => {
        render(<QrTool />);
        expect(screen.getByPlaceholderText('Enter text or URL to generate QR code...')).toBeInTheDocument();
    });

    it('updates input text', () => {
        render(<QrTool />);
        const input = screen.getByPlaceholderText('Enter text or URL to generate QR code...');
        fireEvent.change(input, { target: { value: 'hello' } });
        expect(input).toHaveValue('hello');
    });

    it('switches to scan tab', () => {
        render(<QrTool />);
        fireEvent.click(screen.getByText('Scan'));
        expect(screen.getByText('Scan')).toBeInTheDocument();
    });
});
