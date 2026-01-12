'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import Sidebar from "@/components/layout/Sidebar";
import ThemeToggle from '@/components/ThemeToggle';

export default function ClientLayout({ children }) {
    return (
        <ThemeProvider>
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ marginLeft: '250px', flex: 1, padding: '2rem', minHeight: '100vh', position: 'relative' }}>
                    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100 }}>
                        <ThemeToggle />
                    </div>
                    {children}
                </main>
            </div>
        </ThemeProvider>
    );
}
