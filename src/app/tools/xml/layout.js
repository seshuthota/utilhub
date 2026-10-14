import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/xml');

export default function Layout({ children }) {
    return children;
}
