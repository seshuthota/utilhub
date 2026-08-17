
import { render, screen, within, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '../app/page';

// Mock dependencies
vi.mock('@/config/tools', () => ({
  tools: [
    { id: 'json-formatter', title: 'JSON Formatter', description: 'Format JSON', category: 'data' },
    { id: 'base64', title: 'Base64', description: 'Encode/Decode', category: 'text' }
  ]
}));

vi.mock('@/components/FavoritesProvider', () => ({
  useFavorites: () => ({
    favorites: ['json-formatter'],
    recentTools: ['base64'],
    addRecent: vi.fn(),
  })
}));

vi.mock('@/components/common/ToolCard', () => {
  return {
    default: ({ title }) => <div data-testid="tool-card">{title}</div>
  };
});

describe('Dashboard', () => {
  it('does not render a marketing hero', () => {
    render(<Home />);
    expect(screen.queryByText(/Developer Toolkit/i)).not.toBeInTheDocument();
  });

  it('renders favorites as a compact rail, not a card grid', () => {
    render(<Home />);
    const section = screen.getByLabelText('Favorites');
    expect(within(section).getByText('JSON Formatter')).toBeInTheDocument();
    expect(within(section).queryByTestId('tool-card')).not.toBeInTheDocument();
  });

  it('renders recent tools as a compact rail', () => {
    render(<Home />);
    const section = screen.getByLabelText('Recently Used');
    expect(within(section).getByText('Base64')).toBeInTheDocument();
    expect(within(section).queryByTestId('tool-card')).not.toBeInTheDocument();
  });

  it('renders all tools in the catalog', () => {
    render(<Home />);
    expect(screen.getByText('All Tools')).toBeInTheDocument();
    const catalog = screen.getByLabelText('All Tools');
    const cards = within(catalog).getAllByTestId('tool-card');
    expect(cards).toHaveLength(2);
  });

  it('filters the catalog by category', () => {
    render(<Home />);
    fireEvent.click(screen.getByRole('tab', { name: 'Text' }));
    const catalog = screen.getByLabelText('All Tools');
    const cards = within(catalog).getAllByTestId('tool-card');
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent('Base64');
  });
});
