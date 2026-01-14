
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommandPalette from '../components/CommandPalette';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush })
}));

// Mock tools config
vi.mock('@/config/tools', () => ({
    tools: [
        { id: 'json', title: 'JSON Formatter', description: 'Format JSON', href: '/tools/json', icon: () => null },
        { id: 'sql', title: 'SQL Formatter', description: 'Format SQL', href: '/tools/sql', icon: () => null },
        { id: 'regex', title: 'Regex Tester', description: 'Test Regex', href: '/tools/regex', icon: () => null }
    ]
}));

describe('CommandPalette', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        window.Element.prototype.scrollIntoView = vi.fn();
    });

    it('is hidden by default', () => {
        render(<CommandPalette />);
        expect(screen.queryByPlaceholderText('Search for tools...')).not.toBeInTheDocument();
    });

    it('opens on Cmd+K', async () => {
        render(<CommandPalette />);

        fireEvent.keyDown(window, { key: 'k', metaKey: true });

        expect(screen.getByPlaceholderText('Search for tools...')).toBeInTheDocument();
        expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
    });

    it('filters tools based on query', () => {
        render(<CommandPalette />);
        fireEvent.keyDown(window, { key: 'k', metaKey: true });

        const input = screen.getByPlaceholderText('Search for tools...');
        fireEvent.change(input, { target: { value: 'sql' } });

        expect(screen.getByText('SQL Formatter')).toBeInTheDocument();
        expect(screen.queryByText('JSON Formatter')).not.toBeInTheDocument();
    });

    it('navigates on Enter', () => {
        render(<CommandPalette />);
        fireEvent.keyDown(window, { key: 'k', metaKey: true });

        const input = screen.getByPlaceholderText('Search for tools...');

        // Select SQL (index 1 originally, but let's filter to be safe or navigate down)
        fireEvent.change(input, { target: { value: 'sql' } });

        // Should be first in list now
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(mockPush).toHaveBeenCalledWith('/tools/sql');
    });

    it('navigates with arrow keys', () => {
        render(<CommandPalette />);
        fireEvent.keyDown(window, { key: 'k', metaKey: true });

        const input = screen.getByPlaceholderText('Search for tools...');

        // Initial selection is JSON (index 0)
        // Down -> SQL (index 1)
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(mockPush).toHaveBeenCalledWith('/tools/sql');
    });

    it('closes on Escape', () => {
        render(<CommandPalette />);
        fireEvent.keyDown(window, { key: 'k', metaKey: true });

        expect(screen.getByPlaceholderText('Search for tools...')).toBeInTheDocument();

        fireEvent.keyDown(window, { key: 'Escape' });

        expect(screen.queryByPlaceholderText('Search for tools...')).not.toBeInTheDocument();
    });
});
