import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CsvTool from '../app/tools/csv/page';

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea
            data-testid="code-editor"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
        />
    ),
}));

describe('CsvTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<CsvTool />);
        expect(screen.getByText('CSV Viewer')).toBeInTheDocument();
    });

    it('parses default CSV and shows table', () => {
        render(<CsvTool />);
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('updates table when CSV input changes', () => {
        render(<CsvTool />);
        const editor = screen.getAllByTestId('code-editor')[0];
        fireEvent.change(editor, { target: { value: 'x,y\n1,2\n3,4' } });
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('clears input on clear button', () => {
        render(<CsvTool />);
        fireEvent.click(screen.getByTitle('Clear'));
        const editor = screen.getAllByTestId('code-editor')[0];
        expect(editor).toHaveValue('');
    });
});
