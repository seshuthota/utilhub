import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SqlTool from '../app/tools/sql/page';

vi.mock('@/hooks/useUrlState', () => ({
    useUrlState: (key, defaultValue) => {
        const [val, setVal] = require('react').useState(defaultValue || '');
        return [val, setVal];
    },
}));

vi.mock('@/hooks/useHotkeys', () => ({
    useHotkeys: vi.fn(),
}));

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea data-testid="code-editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} />
    ),
}));

vi.mock('@/components/common/AiAssistBar', () => ({
    default: () => null,
}));

vi.mock('sql-formatter', () => ({
    format: (sql) => sql.toUpperCase(),
}));

vi.mock('alasql', () => {
    const mockAlasql = vi.fn().mockReturnValue([{ id: 1, name: 'Test' }]);
    mockAlasql.fn = {};
    return {
        default: mockAlasql,
    };
});

describe('SqlTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<SqlTool />);
        expect(screen.getByText('SQL Playground')).toBeInTheDocument();
    });

    it('shows editor and run button', () => {
        render(<SqlTool />);
        expect(screen.getByText('Run')).toBeInTheDocument();
        expect(screen.getByText('Format')).toBeInTheDocument();
    });

    it('shows results tab by default', () => {
        render(<SqlTool />);
        expect(screen.getByText('Results')).toBeInTheDocument();
        expect(screen.getByText('Schema')).toBeInTheDocument();
    });
});
