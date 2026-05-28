import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PasswordTool from '../app/tools/password/page';

vi.mock('zxcvbn', () => ({
    default: (password) => {
        if (password === 'password') {
            return { score: 0, guesses: 100, crack_times_display: { online_no_throttling_10_per_second: 'instantly', offline_slow_hashing_1e4_per_second: 'less than a second' }, feedback: { warning: 'This is a very common password', suggestions: ['Add another word'] } };
        }
        return { score: 4, guesses: 1000000, crack_times_display: { online_no_throttling_10_per_second: 'centuries', offline_slow_hashing_1e4_per_second: 'centuries' }, feedback: { warning: null, suggestions: [] } };
    },
}));

describe('PasswordTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<PasswordTool />);
        expect(screen.getByText('Password Audit')).toBeInTheDocument();
    });

    it('shows weak score for common password', () => {
        render(<PasswordTool />);
        const input = screen.getByPlaceholderText('Enter password to analyze...');
        fireEvent.change(input, { target: { value: 'password' } });
        expect(screen.getByText('Very Weak')).toBeInTheDocument();
        expect(screen.getByText(/This is a very common password/)).toBeInTheDocument();
    });

    it('shows strong score for complex password', () => {
        render(<PasswordTool />);
        const input = screen.getByPlaceholderText('Enter password to analyze...');
        fireEvent.change(input, { target: { value: 'CorrectHorseBatteryStaple' } });
        expect(screen.getByText('Very Strong')).toBeInTheDocument();
    });

    it('toggles password visibility', () => {
        render(<PasswordTool />);
        const input = screen.getByPlaceholderText('Enter password to analyze...');
        expect(input).toHaveAttribute('type', 'password');
        const toggleBtn = screen.getByRole('button');
        fireEvent.click(toggleBtn);
        expect(input).toHaveAttribute('type', 'text');
    });
});
