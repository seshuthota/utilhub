
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApiTesterTool from '../app/tools/api-tester/page';

// Mock fetch
global.fetch = vi.fn();

describe('ApiTesterTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with default values', () => {
        render(<ApiTesterTool />);

        expect(screen.getByText('API Tester')).toBeInTheDocument();
        expect(screen.getByDisplayValue('GET')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter URL/i)).toBeInTheDocument();
        expect(screen.getByText('Params')).toBeInTheDocument();
    });

    it('syncs URL and Params', async () => {
        render(<ApiTesterTool />);

        const urlInput = screen.getByPlaceholderText(/Enter URL/i);

        // Change URL, seeing if Params tab *would* update (internal state)
        // Ideally we check if the component reacts. 
        // Let's add a param via the UI and check if URL updates.

        fireEvent.click(screen.getByText('Params'));
        const addBtn = screen.getAllByRole('button').find(b => b.querySelector('svg.lucide-plus'));
        if (addBtn) fireEvent.click(addBtn);

        const keyInputs = screen.getAllByPlaceholderText('Key');
        const valueInputs = screen.getAllByPlaceholderText('Value');

        // Last one should be the new one
        const keyInput = keyInputs[keyInputs.length - 1];
        const valueInput = valueInputs[valueInputs.length - 1];

        fireEvent.change(keyInput, { target: { value: 'testKey' } });
        fireEvent.change(valueInput, { target: { value: 'testValue' } });

        // URL should now contain the param
        expect(urlInput.value).toContain('testKey=testValue');
    });

    it('shows Body tab only for non-GET requests', () => {
        render(<ApiTesterTool />);

        const bodyTab = screen.getByText('Body');
        expect(bodyTab).toBeDisabled();

        const methodSelect = screen.getByDisplayValue('GET');
        fireEvent.change(methodSelect, { target: { value: 'POST' } });

        expect(bodyTab).not.toBeDisabled();
    });

    it('sends request and displays response', async () => {
        const mockResponse = {
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            data: { id: 1, title: 'Test Post' },
            time: 123
        };

        // Mock the proxy response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        render(<ApiTesterTool />);

        const sendBtn = screen.getByText('Send');
        fireEvent.click(sendBtn);

        expect(screen.getByText('Sending...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('Sending...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('OK')).toBeInTheDocument();
        // Check for JSON content
        // Check for JSON content - using querySelector to bypass Prism's span fragmentation
        const codeBlock = document.querySelector('code');
        expect(codeBlock.textContent).toContain('"id": 1');
    });

    it('handles error gracefully', async () => {
        // Mock the proxy failing (e.g. network error)
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Proxy Error' })
        });

        render(<ApiTesterTool />);

        const sendBtn = screen.getByText('Send');
        fireEvent.click(sendBtn);

        await waitFor(() => {
            expect(screen.getByText('Proxy Error')).toBeInTheDocument();
        });
    });
});
