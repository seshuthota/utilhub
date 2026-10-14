import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/lorem');

export default function Layout({ children }) {
    return children;
}
