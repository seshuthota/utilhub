'use client';

import dynamic from "next/dynamic";

const Converter = dynamic(() => import("./Converter"), {
    ssr: false,
    loading: () => (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading converter...
        </div>
    ),
});

export default function CurlConverter() {
    return <Converter />;
}
