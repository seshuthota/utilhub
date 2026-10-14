import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/docker');

export default function Layout({ children }) {
    return children;
}
