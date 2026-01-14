import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "../app/page";

// Mock Lucide icons
vi.mock("lucide-react", () => ({
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
  ImageIcon: () => <div data-testid="icon-imageicon" />,
  LinkIcon: () => <div data-testid="icon-linkicon" />,
}));

// Mock CSS Modules
vi.mock("../app/page.module.css", () => ({
  default: {
    header: "header",
    grid: "grid",
    searchWrapper: "searchWrapper",
    searchIcon: "searchIcon",
    searchInput: "searchInput",
    noResults: "noResults",
    container: "container",
    hero: "hero",
    heroTitle: "heroTitle",
    heroHighlight: "heroHighlight",
    heroSubtitle: "heroSubtitle",
    section: "section",
    sectionTitle: "sectionTitle",
  },
}));

vi.mock("@/components/common/ToolCard.module.css", () => ({
  default: {
    card: "card",
    cardHeader: "cardHeader",
    icon: "icon",
    favoriteBtn: "favoriteBtn",
    active: "active",
    title: "title",
    description: "description",
  },
}));

// Dynamic mock for FavoritesProvider to allow per-test state
const mockUseFavorites = vi.fn();
vi.mock("@/components/FavoritesProvider", () => ({
  useFavorites: () => mockUseFavorites(),
  FavoritesProvider: ({ children }) => <>{children}</>,
}));

// Mock Link
vi.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({ children, href, onClick }) => (
      <a href={href} onClick={onClick}>
        {children}
      </a>
    ),
  };
});

const defaultFavoritesContext = {
  favorites: [],
  recentTools: [],
  toggleFavorite: vi.fn(),
  addRecent: vi.fn(),
  isFavorite: () => false,
};

describe("Dashboard (Home) Page", () => {
  beforeEach(() => {
    mockUseFavorites.mockReturnValue(defaultFavoritesContext);
  });

  it("should render the dashboard header", () => {
    render(<Home />);
    expect(screen.getByText(/Developer Toolkit/i)).toBeInTheDocument();
  });

  it("should render all tool cards", () => {
    render(<Home />);
    expect(screen.getByText("Markdown Viewer")).toBeInTheDocument();
    expect(screen.getByText("JSON Formatter")).toBeInTheDocument();
    expect(screen.getByText("SQL Formatter")).toBeInTheDocument();
    expect(screen.getByText("Base64 Converter")).toBeInTheDocument();
  });

  it("should have correct links", () => {
    render(<Home />);
    const link = screen.getByText("SQL Formatter").closest("a");
    expect(link).toHaveAttribute("href", "/tools/sql");
  });

  it("should render favorites section when tools are favorited", () => {
    mockUseFavorites.mockReturnValue({
      ...defaultFavoritesContext,
      favorites: ["json"],
      isFavorite: (id) => id === "json",
    });
    render(<Home />);
    const favoritesSection = screen.getByText("Favorites").closest("section");
    expect(
      within(favoritesSection).getByText("JSON Formatter"),
    ).toBeInTheDocument();
  });

  it("should render recent section when tools have been used", () => {
    mockUseFavorites.mockReturnValue({
      ...defaultFavoritesContext,
      recentTools: ["base64"],
    });
    render(<Home />);
    const recentSection = screen.getByText("Recently Used").closest("section");
    expect(
      within(recentSection).getByText("Base64 Converter"),
    ).toBeInTheDocument();
  });
});
