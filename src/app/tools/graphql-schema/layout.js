import { getToolMetadata } from '@/config/toolMetadata';

export const metadata = getToolMetadata('/tools/graphql-schema');

export default function Layout({ children }) {
    return children;
}
