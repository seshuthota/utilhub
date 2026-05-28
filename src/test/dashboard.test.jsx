
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import dashboard from '../app/page';

// Mock dependencies
vi.mock('@/config/tools', () => ({
  tools: [
    { id: 'json-formatter', title: 'JSON Formatter', description: 'Format JSON', category: 'json' },
    { id: 'base64', title: 'Base64', description: 'Encode/Decode', category: 'text' }
  ]
}));

vi.mock('@/components/FavoritesProvider', () => ({
  useFavorites: () => ({
    favorites: ['json-formatter'],
    recentTools: ['base64']
  })
}));

vi.mock('@/components/common/ToolCard', () => {
  return {
    default: ({ title }) => <div data-testid="tool-card">{title}</div>
  };
});

describe('Dashboard', () => {
  it('renders the hero section', () => {
    render(dashboard());
    expect(screen.getByText(/Developer Toolkit/i)).toBeInTheDocument();
  });

  it('renders favorites section when favorites exist', () => {
    render(dashboard());
    const section = screen.getByText('Favorites').closest('section');
    expect(within(section).getByText('JSON Formatter')).toBeInTheDocument();
  });

  it('renders recent tools section', () => {
    render(dashboard());
    const section = screen.getByText('Recently Used').closest('section');
    expect(within(section).getByText('Base64')).toBeInTheDocument();
  });

  it('renders all tools section', () => {
    render(dashboard());
    expect(screen.getByText('All Tools')).toBeInTheDocument();
    // Should show both tools in the "All Tools" grid (plus the ones in fav/recent sections)
    // Since we mock ToolCard to just render name, we can check for presence.
    // The implementation renders all tools at the bottom.
    const cards = screen.getAllByTestId('tool-card');
    expect(cards.length).toBeGreaterThan(0);
  });
});
