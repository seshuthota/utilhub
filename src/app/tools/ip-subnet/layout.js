import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/ip-subnet');

export default function Layout({ children }) {
    return children;
}
