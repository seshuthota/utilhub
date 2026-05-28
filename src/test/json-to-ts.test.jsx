
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JsonToTsTool from '../app/tools/json-to-ts/page';

// Mock CodeMirrorEditor to avoid JSDOM issues with CodeMirror
vi.mock('@/components/common/CodeMirrorEditor', () => ({
    default: ({ value, onChange, placeholder, readOnly }) => (
        <textarea
            data-testid="code-editor"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
        />
    )
}));

// Mock Toast
vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() })
}));

describe('JsonToTsTool', () => {
    it('generates TypeScript interfaces from valid JSON', () => {
        render(<JsonToTsTool />);

        // Find input editor (mocked)
        const inputs = screen.getAllByTestId('code-editor');
        const inputEditor = inputs[0];

        // Change input
        const json = JSON.stringify({ name: "Test", age: 25 }, null, 2);
        fireEvent.change(inputEditor, { target: { value: json } });

        // Check output in second editor
        const outputEditor = inputs[1];
        expect(outputEditor.value).toContain('interface User');
        expect(outputEditor.value).toContain('name: string;');
        expect(outputEditor.value).toContain('age: number;');
    });

    it('handles invalid JSON gracefully', () => {
        render(<JsonToTsTool />);

        const inputs = screen.getAllByTestId('code-editor');
        const inputEditor = inputs[0];

        fireEvent.change(inputEditor, { target: { value: '{ invalid: json }' } });

        const outputEditor = inputs[1];
        expect(outputEditor.value).toContain('// Error:');
    });

    it('updates interface name', () => {
        render(<JsonToTsTool />);

        const nameInput = screen.getByPlaceholderText('Root');
        fireEvent.change(nameInput, { target: { value: 'MyInterface' } });

        const inputs = screen.getAllByTestId('code-editor');
        const outputEditor = inputs[1];
        expect(outputEditor.value).toContain('interface MyInterface');
    });
});
