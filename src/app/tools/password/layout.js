import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/password');

export default function Layout({ children }) {
    return children;
}
