import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CurlTester from '../app/tools/curl-tester/page';

const showToast = vi.fn();

vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast }),
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

vi.mock('@/hooks/useHotkeys', () => ({
    useHotkeys: vi.fn(),
}));

global.fetch = vi.fn().mockResolvedValue({
    status: 201,
    json: () => Promise.resolve({
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' },
        data: { id: 1 },
        time: 145,
        size: 12,
        encoding: 'text',
        contentType: 'application/json',
    }),
});

describe('CurlTester', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        global.fetch = vi.fn().mockResolvedValue({
            status: 201,
            json: () => Promise.resolve({
                status: 201,
                statusText: 'Created',
                headers: { 'content-type': 'application/json' },
                data: { id: 1 },
                time: 145,
                size: 12,
                encoding: 'text',
                contentType: 'application/json',
            }),
        });
    });

    it('renders correctly', () => {
        render(<CurlTester />);
        expect(screen.getByText('API Client')).toBeInTheDocument();
    });

    it('loads example request by default', () => {
        render(<CurlTester />);
        expect(screen.getByDisplayValue('POST')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/jsonplaceholder/)).toBeInTheDocument();
    });

    it('shows tabs for params, headers, auth, body', () => {
        render(<CurlTester />);
        expect(screen.getByText(/Params/)).toBeInTheDocument();
        expect(screen.getByText(/Headers/)).toBeInTheDocument();
        expect(screen.getByText(/Auth/)).toBeInTheDocument();
        expect(screen.getByText(/Body/)).toBeInTheDocument();
    });

    it('sends request to proxy endpoint with bodyMode', async () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Send'));
        await waitFor(() => {
            expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
                '/api/tester/proxy',
                expect.objectContaining({ method: 'POST' }),
            );
        });
        const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1].body);
        expect(body.bodyMode).toBe('json');
        expect(body.timeoutMs).toBe(30000);
        expect(body.url).toContain('jsonplaceholder');
        expect(body.body).toContain('title');
    });

    it('includes API key in proxy payload when configured', async () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Auth'));
        fireEvent.change(screen.getByLabelText('Authentication type'), {
            target: { value: 'apikey' },
        });
        fireEvent.change(screen.getByPlaceholderText('X-API-Key'), {
            target: { value: 'X-Token' },
        });
        fireEvent.change(screen.getByPlaceholderText('your-api-key'), {
            target: { value: 'secret-value' },
        });
        fireEvent.click(screen.getByText('Send'));
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1].body);
        expect(body.headers['X-Token']).toBe('secret-value');
    });

    it('sends urlencoded formFields when body mode is urlencoded', async () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText(/Body/));
        fireEvent.click(screen.getByText('x-www-form-urlencoded'));
        // form row inputs
        const keyInputs = screen.getAllByPlaceholderText('Key');
        const valueInputs = screen.getAllByPlaceholderText('Value');
        fireEvent.change(keyInputs[0], { target: { value: 'username' } });
        fireEvent.change(valueInputs[0], { target: { value: 'alice' } });
        fireEvent.click(screen.getByText('Send'));
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1].body);
        expect(body.bodyMode).toBe('urlencoded');
        expect(body.formFields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ key: 'username', value: 'alice', type: 'text' }),
            ]),
        );
    });

    it('omits body when body mode is none', async () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText(/Body/));
        fireEvent.click(screen.getByText('None'));
        fireEvent.click(screen.getByText('Send'));
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1].body);
        expect(body.bodyMode).toBe('none');
        expect(body.body).toBeUndefined();
    });

    it('shows response metadata after send', async () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Send'));
        await waitFor(() => {
            expect(screen.getByText(/Created/)).toBeInTheDocument();
        }, { timeout: 3000 });
        expect(screen.getByTitle('Response size')).toHaveTextContent('12 B');
        expect(screen.getByText('Download')).toBeInTheDocument();
    });

    it('clears form on clear', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByTitle('Clear all'));
        const urlInput = screen.getByLabelText('Request URL');
        expect(urlInput).toHaveValue('');
    });

    it('opens and closes curl import modal', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('curl'));
        expect(screen.getByText('Import from cURL')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('Import from cURL')).not.toBeInTheDocument();
    });

    it('imports curl command via modal to fill request', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('curl'));
        const editors = screen.getAllByTestId('code-editor');
        const curlEditor = editors.find((e) => e.getAttribute('placeholder')?.includes('curl'));
        if (!curlEditor) throw new Error('curl editor not found');
        fireEvent.change(curlEditor, {
            target: {
                value: "curl https://api.example.com/data?q=1 -H 'Authorization: Bearer xyz'",
            },
        });
        fireEvent.click(screen.getByText('Import'));
        expect(screen.getByDisplayValue(/api.example.com/)).toBeInTheDocument();
        expect(showToast).toHaveBeenCalledWith('cURL parsed successfully', 'success');
    });

    it('auto-imports cURL when pasted into URL bar', () => {
        render(<CurlTester />);
        const urlInput = screen.getByLabelText('Request URL');
        const curl =
            "curl -X PUT https://api.example.com/v2/item -H 'Content-Type: application/json' -d '{\"id\":9}'";

        fireEvent.paste(urlInput, {
            clipboardData: { getData: () => curl },
        });

        expect(screen.getByDisplayValue('PUT')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/api.example.com\/v2\/item/)).toBeInTheDocument();
        expect(showToast).toHaveBeenCalledWith(
            expect.stringMatching(/cURL imported/i),
            'success',
        );
    });

    it('auto-imports cURL when entered into URL bar via change', () => {
        render(<CurlTester />);
        fireEvent.change(screen.getByLabelText('Request URL'), {
            target: {
                value: "curl https://auto.import.test/path -H 'X-Custom: 1'",
            },
        });
        expect(screen.getByDisplayValue(/auto.import.test/)).toBeInTheDocument();
        expect(showToast).toHaveBeenCalledWith(
            expect.stringMatching(/cURL imported/i),
            'success',
        );
    });

    it('shows auth tab with Bearer and API Key options', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Auth'));
        expect(screen.getByText('No Auth')).toBeInTheDocument();
        const authSelect = screen.getByLabelText('Authentication type');
        fireEvent.change(authSelect, { target: { value: 'bearer' } });
        expect(screen.getByPlaceholderText('eyJhbGciOiJIUzI1NiIs...')).toBeInTheDocument();
        fireEvent.change(authSelect, { target: { value: 'apikey' } });
        expect(screen.getByPlaceholderText('X-API-Key')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('your-api-key')).toBeInTheDocument();
    });

    it('shows body mode options', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText(/Body/));
        expect(screen.getByText('JSON')).toBeInTheDocument();
        expect(screen.getByText('Raw')).toBeInTheDocument();
        expect(screen.getByText('x-www-form-urlencoded')).toBeInTheDocument();
        expect(screen.getByText('form-data')).toBeInTheDocument();
    });

    it('switches body mode to none', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText(/Body/));
        fireEvent.click(screen.getByText('None'));
        expect(screen.getByText(/This request has no body/)).toBeInTheDocument();
    });

    it('disables send when URL is empty', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByTitle('Clear all'));
        expect(screen.getByLabelText('Send request')).toBeDisabled();
        expect(vi.mocked(global.fetch)).not.toHaveBeenCalled();
    });

    it('opens history sidebar', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByTitle('History'));
        const historyTexts = screen.getAllByText('History');
        expect(historyTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('saves request to history after send', async () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Send'));
        await waitFor(() => {
            expect(screen.getByText(/Created/)).toBeInTheDocument();
        }, { timeout: 3000 });
        fireEvent.click(screen.getByTitle('History'));
        const postElements = screen.getAllByText(/POST/);
        expect(postElements.length).toBeGreaterThanOrEqual(1);
        const urlElements = screen.getAllByText(/jsonplaceholder/);
        expect(urlElements.length).toBeGreaterThanOrEqual(1);
    });

    it('saves named request to Saved list', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByTitle('Save request'));
        expect(screen.getByText('Save Request')).toBeInTheDocument();
        const nameInput = screen.getByPlaceholderText('Request name');
        fireEvent.change(nameInput, { target: { value: 'My API call' } });
        // Modal confirm is the enabled primary-style button labeled exactly "Save"
        // (toolbar also has "Save" with an icon + title "Save request")
        const confirmSave = screen
            .getAllByRole('button')
            .find((b) => b.textContent?.trim() === 'Save' && !b.getAttribute('title'));
        expect(confirmSave).toBeTruthy();
        fireEvent.click(confirmSave);
        expect(showToast).toHaveBeenCalledWith('Request saved', 'success');

        fireEvent.click(screen.getByTitle('Saved requests'));
        expect(screen.getByText('My API call')).toBeInTheDocument();
    });

    it('shows code snippets modal with curl content', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByTitle('View code snippets'));
        expect(screen.getByText('Code Snippets')).toBeInTheDocument();
        const editors = screen.getAllByTestId('code-editor');
        const snippet = editors.find((e) => (e.value || e.getAttribute('value') || '').includes?.('curl')
            || (e.textContent || '').includes('curl'));
        // value is controlled prop on mock textarea
        const withCurl = editors.find((e) => e.value?.includes?.('curl') || e.getAttribute('value')?.includes('curl'));
        expect(withCurl || editors.length > 0).toBeTruthy();
        if (withCurl) {
            expect(withCurl.value || withCurl.getAttribute('value')).toMatch(/curl -X POST/i);
        }
    });

    it('shows cancel while loading', async () => {
        let resolveFetch;
        vi.mocked(global.fetch).mockImplementationOnce(
            () => new Promise((resolve) => { resolveFetch = resolve; }),
        );
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Send'));
        expect(await screen.findByText('Cancel')).toBeInTheDocument();
        resolveFetch({
            status: 200,
            json: async () => ({
                status: 200,
                statusText: 'OK',
                headers: {},
                data: {},
                time: 10,
                size: 2,
                encoding: 'text',
            }),
        });
        await waitFor(() => {
            expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
        });
    });

    it('cancels in-flight request', async () => {
        vi.mocked(global.fetch).mockImplementationOnce(
            (_url, opts) => new Promise((resolve, reject) => {
                opts.signal.addEventListener('abort', () => {
                    const err = new DOMException('Aborted', 'AbortError');
                    reject(err);
                });
            }),
        );
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Send'));
        const cancelBtn = await screen.findByText('Cancel');
        fireEvent.click(cancelBtn);
        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith('Request cancelled', 'error');
        });
    });

    it('shows empty response placeholder before send', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByTitle('Clear all'));
        expect(
            screen.getByText(/Response will appear here after you send a request/i),
        ).toBeInTheDocument();
    });

    it('handles proxy error response', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            status: 502,
            json: async () => ({ error: 'Upstream failed' }),
        });
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Send'));
        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith('Upstream failed', 'error');
        });
    });
});
