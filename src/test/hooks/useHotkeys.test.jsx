
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useHotkeys } from '../../hooks/useHotkeys';

const TestComponent = ({ hotkey, callback, options }) => {
    useHotkeys(hotkey, callback, options);
    return null;
};

describe('useHotkeys Hook', () => {
    it('triggers callback when key is pressed', () => {
        const callback = vi.fn();
        render(<TestComponent hotkey="Enter" callback={callback} />);

        fireEvent.keyDown(document, { key: 'Enter' });
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('requires meta key when specified', () => {
        const callback = vi.fn();
        render(<TestComponent hotkey="Enter" callback={callback} options={{ meta: true }} />);

        fireEvent.keyDown(document, { key: 'Enter' });
        expect(callback).not.toHaveBeenCalled();

        fireEvent.keyDown(document, { key: 'Enter', metaKey: true });
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('requires combination of modifiers', () => {
        const callback = vi.fn();
        render(<TestComponent hotkey="c" callback={callback} options={{ meta: true, shift: true }} />);

        fireEvent.keyDown(document, { key: 'c', metaKey: true });
        expect(callback).not.toHaveBeenCalled();

        fireEvent.keyDown(document, { key: 'c', metaKey: true, shiftKey: true });
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('removes event listener on unmount', () => {
        const callback = vi.fn();
        const { unmount } = render(<TestComponent hotkey="Enter" callback={callback} />);

        unmount();
        fireEvent.keyDown(document, { key: 'Enter' });
        expect(callback).not.toHaveBeenCalled();
    });
});
