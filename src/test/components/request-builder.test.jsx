import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RequestBuilder from '@/components/common/RequestBuilder';

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

const baseRequest = {
    method: 'GET',
    url: '',
    params: [],
    headers: [],
    auth: { type: 'none' },
    bodyMode: 'none',
    body: '',
    formFields: [],
};

describe('RequestBuilder', () => {
    let onChange;
    let onImportCurl;
    let onCurlAutoImport;

    beforeEach(() => {
        onChange = vi.fn();
        onImportCurl = vi.fn();
        onCurlAutoImport = vi.fn();
    });

    function renderBuilder(value = baseRequest) {
        return render(
            <RequestBuilder
                value={value}
                onChange={onChange}
                onImportCurl={onImportCurl}
                onCurlAutoImport={onCurlAutoImport}
            />,
        );
    }

    it('renders URL input and method select', () => {
        renderBuilder({ ...baseRequest, url: 'https://example.com', method: 'GET' });
        expect(screen.getByLabelText('Request URL')).toHaveValue('https://example.com');
        expect(screen.getByLabelText('HTTP method')).toHaveValue('GET');
    });

    it('updates URL and params on normal URL change', () => {
        renderBuilder();
        fireEvent.change(screen.getByLabelText('Request URL'), {
            target: { value: 'https://api.test/path?foo=bar' },
        });
        expect(onChange).toHaveBeenCalled();
        const next = onChange.mock.calls.at(-1)[0];
        expect(next.url).toContain('foo=bar');
        expect(next.params).toEqual([{ key: 'foo', value: 'bar', active: true }]);
        expect(onCurlAutoImport).not.toHaveBeenCalled();
    });

    it('auto-imports cURL when pasted into URL field', () => {
        renderBuilder();
        const input = screen.getByLabelText('Request URL');
        const curl = "curl -X POST https://api.example.com/items -H 'Authorization: Bearer abc' -d '{\"n\":1}'";

        fireEvent.paste(input, {
            clipboardData: { getData: () => curl },
        });

        expect(onChange).toHaveBeenCalled();
        const next = onChange.mock.calls.at(-1)[0];
        expect(next.method).toBe('POST');
        expect(next.url).toContain('api.example.com/items');
        expect(next.auth.type).toBe('bearer');
        expect(next.auth.bearerToken).toBe('abc');
        expect(next.bodyMode).toBe('json');
        expect(onCurlAutoImport).toHaveBeenCalledWith(
            expect.objectContaining({ ok: true }),
        );
    });

    it('auto-imports cURL when typed/changed into URL field', () => {
        renderBuilder();
        fireEvent.change(screen.getByLabelText('Request URL'), {
            target: { value: 'curl https://paste.me/data -H "X-Api-Key: k"' },
        });
        const next = onChange.mock.calls.at(-1)[0];
        expect(next.url).toBe('https://paste.me/data');
        expect(next.headers.some((h) => h.key === 'X-Api-Key' && h.value === 'k')).toBe(true);
        expect(onCurlAutoImport).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
    });

    it('does not treat normal URL paste as curl', () => {
        renderBuilder();
        const input = screen.getByLabelText('Request URL');
        fireEvent.paste(input, {
            clipboardData: { getData: () => 'https://only-a-url.com' },
        });
        // paste handler should not preventDefault path / not call onChange by itself
        expect(onCurlAutoImport).not.toHaveBeenCalled();
    });

    it('opens curl modal via import button', () => {
        renderBuilder();
        fireEvent.click(screen.getByTitle('Import from cURL'));
        expect(onImportCurl).toHaveBeenCalled();
    });

    it('shows API key fields when auth type is apikey', () => {
        renderBuilder();
        fireEvent.click(screen.getByText(/Auth/));
        fireEvent.change(screen.getByLabelText('Authentication type'), {
            target: { value: 'apikey' },
        });
        expect(onChange).toHaveBeenCalled();
        // re-render with apikey auth to see fields
        const { unmount } = render(
            <RequestBuilder
                value={{
                    ...baseRequest,
                    auth: {
                        type: 'apikey',
                        apiKeyName: '',
                        apiKeyValue: '',
                        apiKeyLocation: 'header',
                    },
                }}
                onChange={onChange}
                onImportCurl={onImportCurl}
            />,
        );
        fireEvent.click(screen.getAllByText(/Auth/)[1] || screen.getByText(/Auth/));
        // second instance - get last Auth tab
        const authTabs = screen.getAllByText(/^Auth/);
        fireEvent.click(authTabs[authTabs.length - 1]);
        expect(screen.getByPlaceholderText('X-API-Key')).toBeInTheDocument();
        unmount();
    });

    it('switches body modes', () => {
        renderBuilder({ ...baseRequest, bodyMode: 'json', body: '{}' });
        fireEvent.click(screen.getByText(/Body/));
        fireEvent.click(screen.getByText('form-data'));
        const next = onChange.mock.calls.at(-1)[0];
        expect(next.bodyMode).toBe('multipart');
        expect(Array.isArray(next.formFields)).toBe(true);
    });
});
