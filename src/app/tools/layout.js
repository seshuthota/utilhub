import ToolRouteInfo from '@/components/layout/ToolRouteInfo';
import { DEFAULT_TOOLS_METADATA } from '@/config/toolMetadata';

// Fallback metadata for /tools/*. Each tool folder has its own server
// layout.js exporting the tool-specific title/description via
// getToolMetadata(href), because tool pages are client components.
export const metadata = DEFAULT_TOOLS_METADATA;

export default function ToolsLayout({ children }) {
    return (
        <>
            <ToolRouteInfo />
            {children}
        </>
    );
}
