
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApiTesterTool from '../app/tools/api-tester/page';

// Mock fetch
global.fetch = vi.fn();
// Mock window methods
window.prompt = vi.fn();
window.confirm = vi.fn();

describe('ApiTesterTool Collections', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('creates a new collection', async () => {
        window.prompt.mockReturnValue('My Collection');
        render(<ApiTesterTool />);

        // Open Collections
        const collectionsBtn = screen.getByText('Collections');
        fireEvent.click(collectionsBtn);

        // Click New
        const newBtn = screen.getByText('New');
        fireEvent.click(newBtn);

        expect(window.prompt).toHaveBeenCalledWith('New Collection Name:');
        expect(screen.getByText('My Collection')).toBeInTheDocument();
        expect(screen.getByText('(0)')).toBeInTheDocument();
    });

    it('saves a request to a collection', async () => {
        window.prompt.mockReturnValue('My Collection');

        render(<ApiTesterTool />);

        // Create Collection first
        const collectionsBtn = screen.getByText('Collections');
        fireEvent.click(collectionsBtn);
        const newBtn = screen.getByText('New');
        fireEvent.click(newBtn);

        // Click Save Icon (using title)
        const saveBtn = screen.getByTitle('Save to Collection');
        fireEvent.click(saveBtn);

        // Modal should open
        expect(screen.getByText('Save Request')).toBeInTheDocument();

        // Fill Name
        const nameInput = screen.getByPlaceholderText('e.g., Get All Users');
        fireEvent.change(nameInput, { target: { value: 'My Request' } });

        // Select Collection
        // We need to find the ID of the collection we just created from localStorage to select it
        const savedCollections = JSON.parse(localStorage.getItem('utilhub_api_collections'));
        const collectionId = savedCollections[0].id;

        const selects = screen.getAllByRole('combobox');
        const select = selects.find(s => s.querySelector('option[value=""]'));
        fireEvent.change(select, { target: { value: collectionId } });

        // Click Save in Modal (button with text "Save")
        // Click Save in Modal (button with text "Save")
        const modalSaveBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Save') && !b.title);

        fireEvent.click(modalSaveBtn);

        // Check verification
        // Sidebar should still be open or we might need to open it?
        // In my code, saving doesn't close sidebar, but it does close modal.
        // It saves and closes modal. Sidebar state is independent.
        // If sidebar was open, it stays open?
        // Actually, when I simulated flow: clicked Collections (open), clicked New, then clicked Save Icon.
        // Does clicking Save Icon close sidebar? No.

        expect(screen.getByText('My Collection')).toBeInTheDocument();
        expect(screen.getByText('(1)')).toBeInTheDocument();
        expect(screen.getByText('My Request')).toBeInTheDocument();
    });
});
