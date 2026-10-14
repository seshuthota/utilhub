import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/markdown');

export default function Layout({ children }) {
    return children;
}
