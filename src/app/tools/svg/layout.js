import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/svg');

export default function Layout({ children }) {
    return children;
}
