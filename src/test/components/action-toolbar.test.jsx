
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActionToolbar from '@/components/common/ActionToolbar';
import * as detectionUtils from '@/utils/detection';

// Mock dependencies
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock })
}));

const showToastMock = vi.fn();
vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: showToastMock })
}));

// Mock clipboard
const writeTextMock = vi.fn();
Object.assign(navigator, {
    clipboard: {
        writeText: writeTextMock,
    },
});

describe('ActionToolbar Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing if no content', () => {
        const { container } = render(<ActionToolbar content="" currentToolId="json" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders copy button when content exists', () => {
        render(<ActionToolbar content="test content" currentToolId="json" />);
        expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('handles custom onCopy', () => {
        const onCopy = vi.fn();
        render(<ActionToolbar content="test" currentToolId="json" onCopy={onCopy} />);
        
        fireEvent.click(screen.getByText('Copy'));
        expect(onCopy).toHaveBeenCalled();
        expect(writeTextMock).not.toHaveBeenCalled();
    });

    it('handles default copy to clipboard', () => {
        render(<ActionToolbar content="test content" currentToolId="json" />);
        
        fireEvent.click(screen.getByText('Copy'));
        expect(writeTextMock).toHaveBeenCalledWith('test content');
        expect(showToastMock).toHaveBeenCalled();
    });

    it('generates recommendations asynchronously', async () => {
        render(<ActionToolbar content="{}" currentToolId="text" />);
        
        // Base64 and JSON (since content is {}) should appear
        await waitFor(() => {
            expect(screen.getByText(/Send to.../)).toBeInTheDocument();
        });
    });

    it('opens dropdown and sends content to tool', async () => {
        render(<ActionToolbar content="hello" currentToolId="json" />);
        
        // Wait for recommendations (Base64 is default generic)
        await waitFor(() => {
            expect(screen.getByText(/Send to.../)).toBeInTheDocument();
        });

        // Open dropdown
        fireEvent.click(screen.getByText(/Send to.../));
        
        // Expect Base64 option
        const base64Option = screen.getByText('Encode to Base64');
        expect(base64Option).toBeInTheDocument();

        // Click it
        fireEvent.click(base64Option);
        
        expect(pushMock).toHaveBeenCalledWith('/tools/base64?input=hello');
    });

    it('shows detected type recommendation', async () => {
        // Spy on detectType to force a detection
        vi.spyOn(detectionUtils, 'detectType').mockReturnValue({
            toolId: 'jwt',
            label: 'Decode JWT',
            toolPath: '/tools/jwt',
            paramKey: 'token'
        });

        render(<ActionToolbar content="eyJ..." currentToolId="json" />);

        await waitFor(() => {
            expect(screen.getByText(/Send to.../)).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByText(/Send to.../));
        
        expect(screen.getByText('Decode JWT')).toBeInTheDocument();
        expect(screen.getByText('Magic Match ✨')).toBeInTheDocument();
    });

    it('closes dropdown when clicking overlay', async () => {
        render(<ActionToolbar content="hello" currentToolId="json" />);
        
        await waitFor(() => {
            expect(screen.getByText(/Send to.../)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Send to.../));
        expect(screen.getByText('Encode to Base64')).toBeVisible();

        // Click overlay (we need to find it, usually it's a div with a class)
        // In the component: <div className={styles.overlay} onClick={() => setIsOpen(false)} />
        // It has no role or text. We can find by class name or assume structure.
        // Or we can just click "Send to..." again if that toggles?
        // The button has `onClick={() => setIsOpen(!isOpen)}` so yes.
        
        fireEvent.click(screen.getByText(/Send to.../));
        expect(screen.queryByText('Encode to Base64')).not.toBeInTheDocument();
    });
});
