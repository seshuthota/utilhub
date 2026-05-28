import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import YamlTool from '../app/tools/yaml/page';

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder, readOnly }) => (
        <textarea
            data-testid="code-editor"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
        />
    ),
}));

describe('YamlTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<YamlTool />);
        expect(screen.getByText('YAML Converter')).toBeInTheDocument();
    });

    it('converts YAML to JSON by default', () => {
        render(<YamlTool />);
        const convertBtn = screen.getByTitle('Convert');
        fireEvent.click(convertBtn);
        const editors = screen.getAllByTestId('code-editor');
        const output = editors[1];
        expect(output.value).toContain('"name"');
        expect(output.value).toContain('"UtilHub"');
        expect(output.value).toContain('"active"');
    });

    it('switches mode and converts JSON to YAML', () => {
        render(<YamlTool />);
        fireEvent.click(screen.getByText('JSON to YAML'));
        const editors = screen.getAllByTestId('code-editor');
        const input = editors[0];
        fireEvent.change(input, { target: { value: '{"key": "value"}' } });
        const convertBtn = screen.getByTitle('Convert');
        fireEvent.click(convertBtn);
        const output = editors[1];
        expect(output.value).toContain('key: value');
    });

    it('clears input and output', () => {
        render(<YamlTool />);
        const clearBtn = screen.getByTitle('Clear');
        fireEvent.click(clearBtn);
        const editors = screen.getAllByTestId('code-editor');
        const input = editors[0];
        expect(input).toHaveValue('');
    });
});
