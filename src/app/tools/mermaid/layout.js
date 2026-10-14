import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/mermaid');

export default function Layout({ children }) {
    return children;
}
