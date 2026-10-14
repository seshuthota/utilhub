import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ToolRouteInfo from '@/components/layout/ToolRouteInfo';

let mockPathname = '/tools/json';
vi.mock('next/navigation', () => ({
    usePathname: () => mockPathname,
}));

const addRecent = vi.fn();
vi.mock('@/components/FavoritesProvider', () => ({
    useFavorites: () => ({ addRecent }),
}));

vi.mock('@/config/tools', () => ({
    tools: [
        { id: 'local', title: 'Local', description: 'd', href: '/tools/local', isClientSideOnly: true, hasAiFeatures: false },
        { id: 'ai', title: 'AI', description: 'd', href: '/tools/ai', isClientSideOnly: true, hasAiFeatures: true },
        { id: 'net', title: 'Net', description: 'd', href: '/tools/net', isClientSideOnly: true, usesNetwork: true },
    ],
}));

describe('ToolRouteInfo', () => {
    beforeEach(() => {
        addRecent.mockClear();
    });

    it('shows the client-side badge and records a recent for local tools', () => {
        mockPathname = '/tools/local';
        render(<ToolRouteInfo />);
        expect(screen.getByLabelText(/data never leaves your browser/)).toBeInTheDocument();
        expect(addRecent).toHaveBeenCalledWith('local');
    });

    it('shows only the AI badge for AI tools', () => {
        mockPathname = '/tools/ai';
        render(<ToolRouteInfo />);
        expect(screen.getByLabelText('Optional AI features send the text you choose to Groq')).toBeInTheDocument();
        expect(screen.queryByLabelText(/data never leaves your browser/)).not.toBeInTheDocument();
    });

    it('shows only the network badge for network tools', () => {
        mockPathname = '/tools/net';
        render(<ToolRouteInfo />);
        expect(screen.getByLabelText('Sends requests to the network you choose')).toBeInTheDocument();
        expect(screen.queryByLabelText(/data never leaves your browser/)).not.toBeInTheDocument();
    });

    it('renders nothing and records nothing for unknown routes', () => {
        mockPathname = '/tools/unknown';
        const { container } = render(<ToolRouteInfo />);
        expect(container).toBeEmptyDOMElement();
        expect(addRecent).not.toHaveBeenCalled();
    });
});
