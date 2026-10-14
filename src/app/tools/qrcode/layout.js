import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/qrcode');

export default function Layout({ children }) {
    return children;
}
