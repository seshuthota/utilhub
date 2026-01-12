import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '../app/page';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    FileText: () => <div data-testid="icon-filetext" />,
    Braces: () => <div data-testid="icon-braces" />,
    GitGraph: () => <div data-testid="icon-gitgraph" />,
    FileDiff: () => <div data-testid="icon-filediff" />,
    Database: () => <div data-testid="icon-database" />,
    Crop: () => <div data-testid="icon-crop" />,
    QrCode: () => <div data-testid="icon-qrcode" />,
    FileCode: () => <div data-testid="icon-filecode" />,
    Image: () => <div data-testid="icon-image" />,
    RefreshCcw: () => <div data-testid="icon-refresh" />,
    Clock: () => <div data-testid="icon-clock" />,
    Shield: () => <div data-testid="icon-shield" />,
    ShieldCheck: () => <div data-testid="icon-shield-check" />,
    Type: () => <div data-testid="icon-type" />,
    Link: () => <div data-testid="icon-link" />,
    Search: () => <div data-testid="icon-search" />,
    Star: ({ fill }) => <div data-testid="icon-star" data-fill={fill} />,
}));

// Mock FavoritesProvider
vi.mock('@/components/FavoritesProvider', () => ({
    useFavorites: () => ({
        favorites: [],
        recentTools: [],
        toggleFavorite: vi.fn(),
        addRecent: vi.fn(),
        isFavorite: () => false,
    }),
    FavoritesProvider: ({ children }) => <>{children}</>,
}));

// Mock Link since it's used in ToolCard
vi.mock('next/link', () => {
    return {
        __esModule: true,
        default: ({ children, href, onClick }) => <a href={href} onClick={onClick}>{children}</a>,
    };
});

// Mock CSS Modules
vi.mock('../app/page.module.css', () => ({
    default: {
        header: 'header',
        grid: 'grid',
        searchWrapper: 'searchWrapper',
        searchIcon: 'searchIcon',
        searchInput: 'searchInput',
        noResults: 'noResults',
    }
}));

vi.mock('@/components/common/ToolCard.module.css', () => ({
    default: {
        card: 'card',
        cardHeader: 'cardHeader',
        icon: 'icon',
        favoriteBtn: 'favoriteBtn',
        active: 'active',
        title: 'title',
        description: 'description',
    }
}));

describe('Dashboard (Home) Page', () => {
    it('should render the dashboard header', () => {
        render(<Home />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should render all tool cards', () => {
        render(<Home />);
        // Check for some known tool titles
        expect(screen.getByText('Markdown Viewer')).toBeInTheDocument();
        expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
        expect(screen.getByText('SQL Formatter')).toBeInTheDocument();
        expect(screen.getByText('Base64 Converter')).toBeInTheDocument();
    });

    it('should have correct links', () => {
        render(<Home />);
        const link = screen.getByText('SQL Formatter').closest('a');
        expect(link).toHaveAttribute('href', '/tools/sql');
    });
});
