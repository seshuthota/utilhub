import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JsonSchemaTool from '../app/tools/json-schema/page';

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange }) => (
        <textarea data-testid="code-editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} />
    ),
}));

vi.mock('@/components/common/AiAssistBar', () => ({
    default: () => null,
}));

describe('JsonSchemaTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<JsonSchemaTool />);
        expect(screen.getByText('JSON Schema Validator')).toBeInTheDocument();
    });

    it('shows valid status for correct schema and data', () => {
        render(<JsonSchemaTool />);
        expect(screen.getByText('Valid')).toBeInTheDocument();
    });

    it('shows invalid status when data violates schema', () => {
        render(<JsonSchemaTool />);
        const editors = screen.getAllByTestId('code-editor');
        const dataEditor = editors[1];
        fireEvent.change(dataEditor, { target: { value: '{"age": -5}' } });
        expect(screen.getByText('Invalid')).toBeInTheDocument();
    });

    it('shows parse error for invalid JSON', () => {
        render(<JsonSchemaTool />);
        const editors = screen.getAllByTestId('code-editor');
        const schemaEditor = editors[0];
        fireEvent.change(schemaEditor, { target: { value: 'not json' } });
        expect(screen.getByText('Parse Error')).toBeInTheDocument();
    });
});
