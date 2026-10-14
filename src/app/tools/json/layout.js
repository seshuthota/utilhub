import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/json');

export default function Layout({ children }) {
    return children;
}
