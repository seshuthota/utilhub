import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import CurlTester from '../app/tools/curl-tester/page';
import ResponseViewer from '../components/common/ResponseViewer';
import { encodeShareHash } from '@/utils/apiClientInterop';
import { migrateRequestState } from '@/utils/apiClientRequest';

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

const okResponse = {
    status: 200,
    json: async () => ({ status: 200, statusText: 'OK', headers: {}, data: {}, time: 3, size: 2, encoding: 'text' }),
};

function saveViaModal({ name, newFolder }) {
    fireEvent.click(screen.getByTitle('Save request'));
    fireEvent.change(screen.getByPlaceholderText('Request name'), { target: { value: name } });
    if (newFolder) {
        fireEvent.change(screen.getByLabelText('Folder'), { target: { value: '__new__' } });
        fireEvent.change(screen.getByLabelText('New folder name'), { target: { value: newFolder } });
    }
}

describe('API Client — environments, sharing, collections', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        window.history.replaceState(null, '', '/tools/curl-tester');
        global.fetch = vi.fn().mockResolvedValue(okResponse);
        Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    });

    it('warns about variables that no environment defines', () => {
        render(<CurlTester />);
        fireEvent.change(screen.getByLabelText('Request URL'), { target: { value: '{{base}}/users' } });
        const banner = screen.getByRole('status');
        expect(banner).toHaveTextContent('No environment selected for: {{base}}');
    });

    it('resolves {{vars}} typed in the Params table before sending', async () => {
        localStorage.setItem('utilhub_api_envs', JSON.stringify([
            { id: 'e1', name: 'Dev', variables: [{ key: 'q', value: 'a&b', enabled: true }] },
        ]));
        localStorage.setItem('utilhub_api_active_env', 'e1');
        localStorage.setItem('utilhub_curl_tester_send_mode', 'proxy');
        render(<CurlTester />);
        fireEvent.change(screen.getByLabelText('Request URL'), { target: { value: 'https://api.test/s' } });
        fireEvent.click(screen.getByText(/Params/));
        fireEvent.click(screen.getByText('Add param'));
        fireEvent.change(screen.getByPlaceholderText('Parameter name'), { target: { value: 'search' } });
        fireEvent.change(screen.getByPlaceholderText('Parameter value'), { target: { value: '{{q}}' } });
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Send'));
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(payload.url).toBe('https://api.test/s?search=a%26b');
    });

    it('copies a share link without literal secrets', async () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByText('Auth'));
        fireEvent.change(screen.getByLabelText('Authentication type'), { target: { value: 'bearer' } });
        fireEvent.change(screen.getByPlaceholderText('eyJhbGciOiJIUzI1NiIs...'), { target: { value: 'real-token' } });
        fireEvent.click(screen.getByTitle(/shareable link/));
        await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
        const link = navigator.clipboard.writeText.mock.calls[0][0];
        expect(link).toMatch(/\/tools\/curl-tester#req=/);
        expect(atob(link.split('#req=')[1].replace(/-/g, '+').replace(/_/g, '/'))).not.toContain('real-token');
        expect(showToast).toHaveBeenCalledWith('Share link copied', 'success', expect.stringMatching(/1 secret value was removed/));
    });

    it('opens a request from a share link and clears the hash', async () => {
        const { hash } = encodeShareHash(migrateRequestState({ method: 'DELETE', url: 'https://shared.test/item/7' }));
        window.history.replaceState(null, '', `/tools/curl-tester${hash}`);
        render(<CurlTester />);
        expect(await screen.findByDisplayValue('https://shared.test/item/7')).toBeInTheDocument();
        expect(screen.getByDisplayValue('DELETE')).toBeInTheDocument();
        expect(window.location.hash).toBe('');
    });

    it('saves into a new folder, then updates the same saved request', () => {
        render(<CurlTester />);
        saveViaModal({ name: 'Create post', newFolder: 'Posts' });
        fireEvent.click(screen.getAllByRole('button').find((b) => b.textContent?.trim() === 'Save' && !b.getAttribute('title')));

        fireEvent.click(screen.getByTitle('Saved requests'));
        let panel = screen.getByRole('complementary', { name: 'Collections' });
        expect(within(panel).getByText('Posts')).toBeInTheDocument();
        expect(within(panel).getByText('Create post')).toBeInTheDocument();
        fireEvent.click(within(panel).getByLabelText('Close collections'));

        fireEvent.change(screen.getByLabelText('Request URL'), { target: { value: 'https://jsonplaceholder.typicode.com/posts/2' } });
        fireEvent.click(screen.getByTitle('Save request'));
        expect(screen.getByText(/Editing “Create post”/)).toBeInTheDocument();
        fireEvent.click(screen.getByText('Update'));

        const stored = JSON.parse(localStorage.getItem('utilhub_curl_tester_collections'));
        expect(stored.schemaVersion).toBe(2);
        expect(stored.requests).toHaveLength(1);
        expect(stored.requests[0].request.url).toBe('https://jsonplaceholder.typicode.com/posts/2');
        expect(stored.requests[0].folderId).toBe(stored.folders[0].id);
    });

    it('deletes a folder only after confirming', () => {
        render(<CurlTester />);
        saveViaModal({ name: 'A', newFolder: 'Temp' });
        fireEvent.click(screen.getAllByRole('button').find((b) => b.textContent?.trim() === 'Save' && !b.getAttribute('title')));
        fireEvent.click(screen.getByTitle('Saved requests'));
        const panel = screen.getByRole('complementary', { name: 'Collections' });
        fireEvent.click(within(panel).getByLabelText('Delete folder Temp'));
        expect(within(panel).getByText(/Delete “Temp” and its 1 request\?/)).toBeInTheDocument();
        fireEvent.click(within(panel).getByText('Delete'));
        expect(within(panel).queryByText('Temp')).not.toBeInTheDocument();
        expect(JSON.parse(localStorage.getItem('utilhub_curl_tester_collections')).requests).toHaveLength(0);
    });

    it('imports a Postman collection through the Import / Export dialog', () => {
        render(<CurlTester />);
        fireEvent.click(screen.getByTitle('Saved requests'));
        fireEvent.click(screen.getByText('Import / Export'));
        fireEvent.click(screen.getByRole('tab', { name: 'Import' }));
        fireEvent.change(screen.getByLabelText('Import JSON'), {
            target: {
                value: JSON.stringify({
                    info: { name: 'Petstore', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
                    item: [{ name: 'List pets', request: { method: 'GET', url: 'https://pets.test/pets' } }],
                    variable: [{ key: 'host', value: 'pets.test' }],
                }),
            },
        });
        expect(screen.getByText(/1 folder, 1 request, 1 environment/)).toBeInTheDocument();
        fireEvent.click(screen.getAllByRole('button').find((b) => b.textContent === 'Import'));
        expect(showToast).toHaveBeenCalledWith('Imported 1 requests and 1 environments', 'success');

        fireEvent.click(screen.getByTitle('Saved requests'));
        const panel = screen.getByRole('complementary', { name: 'Collections' });
        expect(within(panel).getByText('List pets')).toBeInTheDocument();
        expect(screen.getByLabelText('Active environment')).toHaveDisplayValue('Petstore (collection variables)');
    });
});

describe('ResponseViewer safety', () => {
    it('renders SVG responses as an image, never as inline markup', () => {
        const { container } = render(
            <ResponseViewer
                response={{
                    status: 200, statusText: 'OK', time: 1,
                    headers: { 'content-type': 'image/svg+xml' },
                    data: '<svg onload="alert(1)"><circle r="5"/></svg>',
                }}
            />,
        );
        fireEvent.click(screen.getByText('Preview'));
        expect(container.querySelector('svg[onload]')).toBeNull();
        expect(screen.getByAltText('SVG response preview').getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
    });

    it('masks sensitive sent headers until revealed', () => {
        render(
            <ResponseViewer
                response={{
                    status: 200, statusText: 'OK', time: 1, headers: {}, data: '',
                    requestHeadersSent: { Authorization: 'Bearer secret-123', Accept: 'application/json' },
                    transport: 'proxy',
                }}
            />,
        );
        fireEvent.click(screen.getByText(/Request sent/));
        expect(screen.queryByText('Bearer secret-123')).not.toBeInTheDocument();
        expect(screen.getByText('application/json')).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText('Show secret header values'));
        expect(screen.getByText('Bearer secret-123')).toBeInTheDocument();
    });
});
