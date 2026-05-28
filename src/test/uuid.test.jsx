import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UUIDTool from '../app/tools/uuid/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

describe('UUIDTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<UUIDTool />);
        expect(screen.getByText('UUID Generator')).toBeInTheDocument();
    });

    it('generates a default UUID v4', () => {
        render(<UUIDTool />);
        const codeElements = screen.getAllByText(/-/);
        expect(codeElements.length).toBeGreaterThan(0);
    });

    it('generates new UUIDs on generate click', () => {
        render(<UUIDTool />);
        fireEvent.click(screen.getByText('Generate'));
        const codeElements = screen.getAllByText(/-/);
        expect(codeElements.length).toBeGreaterThan(0);
    });

    it('clears UUIDs on clear', () => {
        const { container } = render(<UUIDTool />);
        fireEvent.click(screen.getByText('Clear'));
        const codes = container.querySelectorAll('code');
        const uuidCodes = Array.from(codes).filter(c => c.textContent && c.textContent.includes('-'));
        expect(uuidCodes.length).toBe(0);
    });
});
