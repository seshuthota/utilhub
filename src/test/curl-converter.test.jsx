
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import CurlConverter from '../app/tools/curl/page';

// Mock clipboard
const mockWriteText = vi.fn();
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText,
    },
});

// Mock ResizeObserver for CodeEditor
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock useUrlState
vi.mock('@/hooks/useUrlState', async (importOriginal) => {
    const React = await import('react');
    return {
        useUrlState: (key, initial) => React.useState(initial),
    };
});

// Mock CodeEditor to mostly avoid Prism issues, though we want to test interaction
vi.mock('@/components/common/CodeEditor', () => {
    return {
        __esModule: true,
        default: ({ value, onChange, placeholder, readOnly, "data-testid": testId }) => (
            <textarea
                data-testid={testId || (readOnly ? "output-editor" : "input-editor")}
                value={value}
                onChange={(e) => onChange && onChange(e.target.value)}
                placeholder={placeholder}
                readOnly={readOnly}
            />
        ),
    };
});

// Mock curlconverter
// We verify that the library functions are called correctly
vi.mock('curlconverter', () => ({
    toPython: (curl) => {
        if (curl.includes("error")) throw new Error("Parse error");
        return "requests.get('https://example.com')";
    },
    toNodeFetch: () => "fetch('https://example.com')",
    toGo: () => "http.Get(\"https://example.com\")"
}));

describe('Curl Converter', () => {
    it('renders correctly', () => {
        render(<CurlConverter />);
        expect(screen.getByText(/Curl Converter/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/curl https/i)).toBeInTheDocument();
    });

    it('converts curl to default language (python)', () => {
        render(<CurlConverter />);
        const input = screen.getByTestId('input-editor');

        fireEvent.change(input, { target: { value: "curl https://example.com" } });

        expect(screen.getByTestId('output-editor')).toHaveValue("requests.get('https://example.com')");
    });

    it('handles errors gracefully', () => {
        render(<CurlConverter />);
        const input = screen.getByTestId('input-editor');

        // Trigger mock error
        fireEvent.change(input, { target: { value: "curl error" } });

        expect(screen.getByText(/Invalid cURL command/i)).toBeInTheDocument();
    });
});
