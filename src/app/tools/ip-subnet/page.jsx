'use client';

import { useState, useMemo } from 'react';
import { Copy, AlertCircle } from 'lucide-react';
import { useUrlState } from '@/hooks/useUrlState';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

// Helper: IP to Long
const ip2long = (ip) => {
    let components;
    if (components = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)) {
        let ipl = 0;
        components.shift();
        for (let i = 0; i < 4; i++) {
            ipl *= 256;
            ipl += parseInt(components[i]);
        }
        return ipl;
    }
    return 0;
};

// Helper: Long to IP
const long2ip = (ipl) => {
    return (
        (ipl >>> 24) + '.' +
        (ipl >> 16 & 255) + '.' +
        (ipl >> 8 & 255) + '.' +
        (ipl & 255)
    );
};

export default function IpSubnetTool() {
    const [ip, setIp] = useUrlState('ip', '192.168.1.1');
    const [mask, setMask] = useUrlState('mask', '24');
    const { showToast } = useToast();

    const calculation = useMemo(() => {
        try {
            // Validate IP
            if (!ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)) {
                return null;
            }

            // Subnet mask details
            const cidr = parseInt(mask);
            if (cidr < 0 || cidr > 32) return null;

            const hostBits = 32 - cidr;
            const subnetMaskLong = -1 << hostBits;
            const ipLong = ip2long(ip);
            const networkLong = ipLong & subnetMaskLong;
            const broadcastLong = networkLong | ~subnetMaskLong;

            // Usable range
            const firstIpLong = networkLong + 1;
            const lastIpLong = broadcastLong - 1;
            const usableHosts = Math.pow(2, hostBits) - 2;

            return {
                cidr: `/${cidr}`,
                subnetMask: long2ip(subnetMaskLong),
                networkAddress: long2ip(networkLong),
                broadcastAddress: long2ip(broadcastLong),
                firstUsable: long2ip(firstIpLong),
                lastUsable: long2ip(lastIpLong),
                hosts: usableHosts > 0 ? usableHosts.toLocaleString() : '0',
                ipClass: getIpClass(parseInt(ip.split('.')[0])),
                type: isPrivate(ipLong) ? 'Private' : 'Public'
            };

        } catch (e) {
            return null;
        }
    }, [ip, mask]);

    function getIpClass(firstOctet) {
        if (firstOctet >= 1 && firstOctet <= 126) return 'A';
        if (firstOctet >= 128 && firstOctet <= 191) return 'B';
        if (firstOctet >= 192 && firstOctet <= 223) return 'C';
        if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
        if (firstOctet >= 240 && firstOctet <= 255) return 'E (Experimental)';
        return 'Unknown';
    }

    function isPrivate(ipLong) {
        // 10.0.0.0 - 10.255.255.255
        if ((ipLong >= ip2long('10.0.0.0')) && (ipLong <= ip2long('10.255.255.255'))) return true;
        // 172.16.0.0 - 172.31.255.255
        if ((ipLong >= ip2long('172.16.0.0')) && (ipLong <= ip2long('172.31.255.255'))) return true;
        // 192.168.0.0 - 192.168.255.255
        if ((ipLong >= ip2long('192.168.0.0')) && (ipLong <= ip2long('192.168.255.255'))) return true;
        return false;
    }

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showToast(`${label} copied!`, 'success');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>IP Subnet Calculator</h1>
                <p className={styles.description}>Calculate subnet masks, valid host ranges, and network addresses.</p>
            </header>

            <div className={styles.card}>
                <div className={styles.inputGroup}>
                    <div className={styles.field}>
                        <label className={styles.label}>IP Address</label>
                        <input
                            type="text"
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            className={styles.input}
                            placeholder="192.168.1.1"
                        />
                    </div>
                    <div className={styles.field} style={{ flex: '0 0 120px' }}>
                        <label className={styles.label}>CIDR / Netmask</label>
                        <select
                            value={mask}
                            onChange={(e) => setMask(e.target.value)}
                            className={styles.select}
                        >
                            {Array.from({ length: 33 }, (_, i) => (
                                <option key={32 - i} value={32 - i}>/{32 - i}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {calculation ? (
                    <div className={styles.results}>
                        <ResultItem label="Network Address" value={calculation.networkAddress} copy={copyToClipboard} />
                        <ResultItem label="Broadcast Address" value={calculation.broadcastAddress} copy={copyToClipboard} />
                        <ResultItem label="Subnet Mask" value={calculation.subnetMask} copy={copyToClipboard} />
                        <ResultItem label="Usable Hosts" value={calculation.hosts} copy={copyToClipboard} />
                        <ResultItem label="First IP" value={calculation.firstUsable} copy={copyToClipboard} />
                        <ResultItem label="Last IP" value={calculation.lastUsable} copy={copyToClipboard} />
                        <ResultItem label="CIDR Notation" value={calculation.cidr} copy={copyToClipboard} />
                        <ResultItem label="IP Class" value={calculation.ipClass} copy={copyToClipboard} />
                        <ResultItem label="IP Type" value={calculation.type} copy={copyToClipboard} />
                    </div>
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <AlertCircle className="mx-auto mb-2" />
                        Please enter a valid IP address
                    </div>
                )}
            </div>
        </div>
    );
}

function ResultItem({ label, value, copy }) {
    return (
        <div className={styles.resultItem}>
            <span className={styles.resultLabel}>{label}</span>
            <span className={styles.resultValue}>{value}</span>
            <button
                onClick={() => copy(value, label)}
                className={styles.copyBtn}
                title="Copy"
            >
                <Copy size={16} />
            </button>
        </div>
    );
}
