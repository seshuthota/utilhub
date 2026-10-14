import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/url');

export default function Layout({ children }) {
    return children;
}
