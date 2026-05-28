import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ValidateTool from '../app/tools/validate/page';

describe('ValidateTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<ValidateTool />);
        expect(screen.getByText('Email & URL Validator')).toBeInTheDocument();
    });

    it('shows tabs for email and url', () => {
        render(<ValidateTool />);
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('URL')).toBeInTheDocument();
    });

    it('validates a correct email', () => {
        render(<ValidateTool />);
        const input = screen.getByPlaceholderText('Enter email address...');
        fireEvent.change(input, { target: { value: 'user@example.com' } });
        expect(screen.getByText(/Valid email/i)).toBeInTheDocument();
    });

    it('rejects an invalid email', () => {
        render(<ValidateTool />);
        const input = screen.getByPlaceholderText('Enter email address...');
        fireEvent.change(input, { target: { value: 'not-an-email' } });
        expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
    });

    it('validates a correct URL', () => {
        render(<ValidateTool />);
        fireEvent.click(screen.getByText('URL'));
        const input = screen.getByPlaceholderText('Enter URL...');
        fireEvent.change(input, { target: { value: 'https://example.com' } });
        expect(screen.getByText(/Valid URL/i)).toBeInTheDocument();
    });

    it('rejects an invalid URL', () => {
        render(<ValidateTool />);
        fireEvent.click(screen.getByText('URL'));
        const input = screen.getByPlaceholderText('Enter URL...');
        fireEvent.change(input, { target: { value: 'not a url' } });
        expect(screen.getByText(/Invalid URL/i)).toBeInTheDocument();
    });

    it('shows URL components for valid URL', () => {
        render(<ValidateTool />);
        fireEvent.click(screen.getByText('URL'));
        const input = screen.getByPlaceholderText('Enter URL...');
        fireEvent.change(input, { target: { value: 'https://example.com/path?q=1' } });
        expect(screen.getByText('URL Components')).toBeInTheDocument();
        expect(screen.getByText('https:')).toBeInTheDocument();
        expect(screen.getByText('/path')).toBeInTheDocument();
        expect(screen.getByText('?q=1')).toBeInTheDocument();
    });
});
