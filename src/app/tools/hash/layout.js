import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/hash');

export default function Layout({ children }) {
    return children;
}
