import { tools } from '@/config/tools';

// Helper to generate metadata for each tool page
export async function generateMetadata({ params }) {
    const segments = params?.slug || [];
    const toolSlug = segments[0] || '';

    const tool = tools.find(t => t.href === `/tools/${toolSlug}`);

    if (tool) {
        return {
            title: `${tool.title} | UtilHub`,
            description: tool.description,
        };
    }

    return {
        title: 'Developer Tools | UtilHub',
        description: 'A suite of developer utilities for your daily workflow.',
    };
}

export default function ToolsLayout({ children }) {
    return <>{children}</>;
}
