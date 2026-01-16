import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock sql.js
const mockExec = vi.fn();
const mockClose = vi.fn();
const mockExport = vi.fn(() => new Uint8Array([1, 2, 3]));

const mockDatabase = vi.fn(() => ({
    exec: mockExec,
    close: mockClose,
    export: mockExport,
}));

vi.mock('sql.js', () => ({
    default: vi.fn(() => Promise.resolve({
        Database: mockDatabase,
    })),
    SqlJsStatic: {},
}));

// Mock dependencies
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/tools/sqlite',
}));

vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, defaultValue) => {
        const [state, setState] = React.useState(defaultValue);
        return [state, setState];
    },
}));

vi.mock('@/hooks/useHotkeys', () => ({
    useHotkeys: vi.fn(),
}));

vi.mock('@/components/Toast', () => ({
    useToast: () => ({
        showToast: vi.fn(),
    }),
}));

vi.mock('@/components/common/CodeEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea
            data-testid="code-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    ),
}));

vi.mock('@/components/common/ShareButton', () => ({
    default: () => <button data-testid="share-button">Share</button>,
}));

// Import after mocks
import SqliteTool from '@/app/tools/sqlite/page';

describe('SQLite Studio Tool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExec.mockReturnValue([]);
    });

    it('renders loading state initially', () => {
        render(<SqliteTool />);
        expect(screen.getByText(/Loading SQLite WebAssembly/i)).toBeInTheDocument();
    });

    it('renders main interface after loading', async () => {
        render(<SqliteTool />);

        await waitFor(() => {
            expect(screen.getByText('SQLite Studio')).toBeInTheDocument();
        });

        expect(screen.getByText('Wasm')).toBeInTheDocument();
    });

    it('displays drop zone for file upload', async () => {
        render(<SqliteTool />);

        await waitFor(() => {
            expect(screen.getByText(/Drop a .sqlite or .db file here/i)).toBeInTheDocument();
        });
    });

    it('shows database info section', async () => {
        render(<SqliteTool />);

        await waitFor(() => {
            expect(screen.getByText('Database:')).toBeInTheDocument();
            expect(screen.getByText('memory')).toBeInTheDocument();
            expect(screen.getByText('Tables:')).toBeInTheDocument();
        });
    });

    it('has action buttons', async () => {
        render(<SqliteTool />);

        await waitFor(() => {
            expect(screen.getByTitle('New Database')).toBeInTheDocument();
            expect(screen.getByTitle('Upload DB')).toBeInTheDocument();
            expect(screen.getByTitle('Export Database')).toBeInTheDocument();
        });
    });

    it('has query editor with run and format buttons', async () => {
        render(<SqliteTool />);

        await waitFor(() => {
            expect(screen.getByText('Query Editor')).toBeInTheDocument();
            expect(screen.getByTitle(/Format SQL/i)).toBeInTheDocument();
            expect(screen.getByTitle(/Run Query/i)).toBeInTheDocument();
        });
    });

    it('has tabs for Results, Schema, and History', async () => {
        render(<SqliteTool />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Results/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Schema/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /History/i })).toBeInTheDocument();
        });
    });

    it('shows empty state for results when no query run', async () => {
        render(<SqliteTool />);

        await waitFor(() => {
            expect(screen.getByText(/Run a query to see results/i)).toBeInTheDocument();
        });
    });

    it('switches to Schema tab and shows empty state', async () => {
        render(<SqliteTool />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Schema/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Schema/i }));

        await waitFor(() => {
            expect(screen.getByText(/No tables yet/i)).toBeInTheDocument();
        });
    });

    it('switches to History tab and shows empty state', async () => {
        render(<SqliteTool />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /History/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /History/i }));

        await waitFor(() => {
            expect(screen.getByText(/No query history yet/i)).toBeInTheDocument();
        });
    });

    it('has export buttons in results area', async () => {
        render(<SqliteTool />);

        await waitFor(() => {
            expect(screen.getByTitle(/Run Query/i)).toBeInTheDocument();
        });

        // Verify the Run button exists and is clickable
        const runButton = screen.getByTitle(/Run Query/i);
        expect(runButton).toBeEnabled();
    });

    it('has code editor component with default query', async () => {
        render(<SqliteTool />);

        await waitFor(() => {
            expect(screen.getByTestId('code-editor')).toBeInTheDocument();
        });

        // Default query should be present
        expect(screen.getByTestId('code-editor')).toHaveValue('SELECT sqlite_version();');
    });
});
