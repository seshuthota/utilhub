
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IpSubnetTool from '../app/tools/ip-subnet/page';

// Mock Toast and useUrlState
vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() })
}));

vi.mock('@/hooks/useUrlState', () => {
    const React = require('react');
    return {
        useUrlState: (key, initial) => React.useState(initial)
    };
});

describe('IpSubnetTool', () => {
    it('calculates subnet details correctly for /24', () => {
        render(<IpSubnetTool />);

        const ipInput = screen.getByPlaceholderText('192.168.1.1');
        fireEvent.change(ipInput, { target: { value: '192.168.1.10' } });

        // Select /24 (Netmask)
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '24' } });

        // Verify Results
        expect(screen.getAllByText('192.168.1.0')[0]).toBeInTheDocument(); // Network
        expect(screen.getByText('192.168.1.255')).toBeInTheDocument(); // Broadcast
        expect(screen.getByText('255.255.255.0')).toBeInTheDocument(); // Mask
        expect(screen.getByText('254')).toBeInTheDocument(); // Hosts
        expect(screen.getByText('192.168.1.1')).toBeInTheDocument(); // First
        expect(screen.getByText('192.168.1.254')).toBeInTheDocument(); // Last
        expect(screen.getByText('C')).toBeInTheDocument(); // Class is inferred from first octet
    });

    it('identifies private IP addresses', () => {
        render(<IpSubnetTool />);

        const ipInput = screen.getByPlaceholderText('192.168.1.1');
        fireEvent.change(ipInput, { target: { value: '10.0.0.1' } });

        expect(screen.getByText('Private')).toBeInTheDocument();
    });

    it('identifies public IP addresses', () => {
        render(<IpSubnetTool />);

        const ipInput = screen.getByPlaceholderText('192.168.1.1');
        fireEvent.change(ipInput, { target: { value: '8.8.8.8' } });

        expect(screen.getByText('Public')).toBeInTheDocument();
    });
});
