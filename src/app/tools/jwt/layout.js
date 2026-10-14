import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/jwt');

export default function Layout({ children }) {
    return children;
}
