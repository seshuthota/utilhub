"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Initial check
        setIsOffline(!navigator.onLine);

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: "fixed",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "var(--error-bg)",
                color: "var(--error-color)",
                border: "1px solid var(--error-color)",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                zIndex: 9999,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                pointerEvents: "none",
            }}
        >
            <WifiOff size={16} />
            <span>You are currently offline</span>
        </div>
    );
}
