
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImageTool from '../app/tools/image/page';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test');

// Mock Image
global.Image = class {
    constructor() {
        this.onload = null;
        this.width = 0;
        this.height = 0;
        this.src = '';
    }
    set src(value) {
        // Trigger onload async
        setTimeout(() => {
            this.width = 800;
            this.height = 600;
            if (this.onload) this.onload();
        }, 10);
    }
};

describe('ImageTool', () => {
    it('locks aspect ratio by default', async () => {
        render(<ImageTool />);

        // Upload image
        const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
        const input = screen.getByLabelText('Upload Image').previousElementSibling; // Input is hidden, label is clickable
        // Actually best to target input by id or generic input
        const fileInput = document.getElementById('fileInput');
        fireEvent.change(fileInput, { target: { files: [file] } });

        // Wait for image to load (settings appear)
        await waitFor(() => expect(screen.getByText('Width (px)')).toBeInTheDocument());

        // Check Lock Aspect Ratio is checked
        const lockCheckbox = screen.getByLabelText('Lock Aspect Ratio');
        expect(lockCheckbox).toBeChecked();

        // Change Width -> Height should update
        // Ratio is 800/600 = 1.333
        const widthInput = screen.getAllByRole('spinbutton')[0]; // First is width
        const heightInput = screen.getAllByRole('spinbutton')[1]; // Second is height

        fireEvent.change(widthInput, { target: { value: '400' } });
        expect(heightInput.value).toBe('300'); // 400 / 1.333 = 300
    });

    it('updates width when height changes while locked', async () => {
        render(<ImageTool />);

        const file = new File(['test'], 'test.png', { type: 'image/png' });
        const fileInput = document.getElementById('fileInput');
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => expect(screen.getByText('Width (px)')).toBeInTheDocument());

        const widthInput = screen.getAllByRole('spinbutton')[0];
        const heightInput = screen.getAllByRole('spinbutton')[1];

        // Change Height -> Width should update
        fireEvent.change(heightInput, { target: { value: '300' } });
        expect(widthInput.value).toBe('400');
    });

    it('allows independent resizing when unlocked', async () => {
        render(<ImageTool />);

        const file = new File(['test'], 'test.png', { type: 'image/png' });
        const fileInput = document.getElementById('fileInput');
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => expect(screen.getByText('Width (px)')).toBeInTheDocument());

        // Uncheck Lock
        const lockCheckbox = screen.getByLabelText('Lock Aspect Ratio');
        fireEvent.click(lockCheckbox);
        expect(lockCheckbox).not.toBeChecked();

        const widthInput = screen.getAllByRole('spinbutton')[0];
        const heightInput = screen.getAllByRole('spinbutton')[1];

        // Change Width -> Height should NOT change
        // Initial height is 600
        fireEvent.change(widthInput, { target: { value: '100' } });
        expect(heightInput.value).toBe('600');
    });
});
