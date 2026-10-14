import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/chmod');

export default function Layout({ children }) {
    return children;
}
