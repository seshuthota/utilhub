import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/image');

export default function Layout({ children }) {
    return children;
}
