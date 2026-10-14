import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommandPalette from '@/components/common/CommandPalette';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

// Keep smart-detection out of these tests so results are deterministic
vi.mock('@/utils/detection', () => ({
    detectType: () => null,
}));

vi.mock('@/config/tools', () => ({
    tools: [
        { id: 'json', title: 'JSON Formatter', description: 'Format JSON', href: '/tools/json', icon: () => null },
        { id: 'sql', title: 'SQL Formatter', description: 'Format SQL', href: '/tools/sql', icon: () => null },
        { id: 'regex', title: 'Regex Tester', description: 'Test Regex', href: '/tools/regex', icon: () => null },
    ],
}));

const PLACEHOLDER = 'Search tools or paste content...';

describe('CommandPalette', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when closed', () => {
        render(<CommandPalette isOpen={false} onClose={vi.fn()} />);
        expect(screen.queryByPlaceholderText(PLACEHOLDER)).not.toBeInTheDocument();
    });

    it('lists all tools when open', () => {
        render(<CommandPalette isOpen onClose={vi.fn()} />);
        expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();
        expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
        expect(screen.getByText('SQL Formatter')).toBeInTheDocument();
        expect(screen.getByText('Regex Tester')).toBeInTheDocument();
    });

    it('filters tools based on query', () => {
        render(<CommandPalette isOpen onClose={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: 'sql' } });

        expect(screen.getByText('SQL Formatter')).toBeInTheDocument();
        expect(screen.queryByText('JSON Formatter')).not.toBeInTheDocument();
    });

    it('navigates to the first match on Enter and closes', () => {
        const onClose = vi.fn();
        render(<CommandPalette isOpen onClose={onClose} />);
        fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: 'sql' } });
        fireEvent.keyDown(window, { key: 'Enter' });

        expect(mockPush).toHaveBeenCalledWith('/tools/sql');
        expect(onClose).toHaveBeenCalled();
    });

    it('navigates with arrow keys', () => {
        render(<CommandPalette isOpen onClose={vi.fn()} />);
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        fireEvent.keyDown(window, { key: 'Enter' });

        expect(mockPush).toHaveBeenCalledWith('/tools/sql');
    });

    it('wraps around with ArrowUp', () => {
        render(<CommandPalette isOpen onClose={vi.fn()} />);
        fireEvent.keyDown(window, { key: 'ArrowUp' });
        fireEvent.keyDown(window, { key: 'Enter' });

        expect(mockPush).toHaveBeenCalledWith('/tools/regex');
    });

    it('handles arrow keys with zero results without breaking selection', () => {
        render(<CommandPalette isOpen onClose={vi.fn()} />);
        const input = screen.getByPlaceholderText(PLACEHOLDER);

        fireEvent.change(input, { target: { value: 'zzz-no-match' } });
        expect(screen.getByText(/No tools found/)).toBeInTheDocument();
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        fireEvent.keyDown(window, { key: 'ArrowUp' });
        fireEvent.keyDown(window, { key: 'Enter' });
        expect(mockPush).not.toHaveBeenCalled();

        // Clearing the query should still allow selecting the first tool
        fireEvent.change(input, { target: { value: '' } });
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        fireEvent.keyDown(window, { key: 'Enter' });
        expect(mockPush).toHaveBeenCalledWith('/tools/sql');
    });

    it('closes on Escape', () => {
        const onClose = vi.fn();
        render(<CommandPalette isOpen onClose={onClose} />);
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });

    it('navigates on click', () => {
        render(<CommandPalette isOpen onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Regex Tester'));
        expect(mockPush).toHaveBeenCalledWith('/tools/regex');
    });
});
