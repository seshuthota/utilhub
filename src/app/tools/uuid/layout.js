import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/uuid');

export default function Layout({ children }) {
    return children;
}
