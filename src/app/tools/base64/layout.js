import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/base64');

export default function Layout({ children }) {
    return children;
}
