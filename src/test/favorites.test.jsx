
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FavoritesProvider, useFavorites } from '../components/FavoritesProvider';
import ToolCard from '../components/common/ToolCard';
import { FileText } from 'lucide-react';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test component to access context
const TestComponent = () => {
    const { favorites, toggleFavorite, isFavorite } = useFavorites();
    return (
        <div>
            <div data-testid="count">{favorites.length}</div>
            <button onClick={() => toggleFavorite('tool-1')}>Toggle Tool 1</button>
            <div data-testid="is-fav">{isFavorite('tool-1') ? 'yes' : 'no'}</div>
        </div>
    );
};

describe('Favorites System', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    it('provides default empty state', () => {
        render(
            <FavoritesProvider>
                <TestComponent />
            </FavoritesProvider>
        );
        expect(screen.getByTestId('count')).toHaveTextContent('0');
        expect(screen.getByTestId('is-fav')).toHaveTextContent('no');
    });

    it('toggles favorite status', async () => {
        render(
            <FavoritesProvider>
                <TestComponent />
            </FavoritesProvider>
        );

        const btn = screen.getByText('Toggle Tool 1');

        // Add
        fireEvent.click(btn);
        expect(screen.getByTestId('count')).toHaveTextContent('1');
        expect(screen.getByTestId('is-fav')).toHaveTextContent('yes');
        expect(localStorage.setItem).toHaveBeenCalledWith('utilhub-favorites', JSON.stringify(['tool-1']));

        // Remove
        fireEvent.click(btn);
        expect(screen.getByTestId('count')).toHaveTextContent('0');
        expect(screen.getByTestId('is-fav')).toHaveTextContent('no');
    });

    it('loads from localStorage', async () => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify(['tool-1', 'tool-2']));

        render(
            <FavoritesProvider>
                <TestComponent />
            </FavoritesProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('count')).toHaveTextContent('2');
            expect(screen.getByTestId('is-fav')).toHaveTextContent('yes');
        });
    });
});

describe('ToolCard Interaction', () => {
    it('renders and handles favorite click via overlay structure', () => {
        render(
            <FavoritesProvider>
                <ToolCard
                    id="markdown"
                    title="Markdown Viewer"
                    description="Test desc"
                    href="/tools/markdown"
                    icon={FileText}
                />
            </FavoritesProvider>
        );

        expect(screen.getByText('Markdown Viewer')).toBeInTheDocument();

        // Find star button
        const starBtn = screen.getByLabelText('Add to favorites');
        fireEvent.click(starBtn);

        // Should change state (we'd need to mock Provider or check internal state change if we could, 
        // but here checking if button changes label/class might be hard without re-render from parent)
        // Ideally we check if it called context but we are using real provider here.

        // Check new label
        expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
    });
});
