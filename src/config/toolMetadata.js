import { tools } from "@/config/tools";

const DEFAULT_TOOLS_METADATA = {
  title: "Developer Tools | UtilHub",
  description: "A suite of developer utilities for your daily workflow.",
};

/**
 * Find a registered tool by its route (e.g. "/tools/json").
 * Trailing slashes and query/hash parts are ignored.
 */
export function getToolByHref(href) {
  if (!href) return undefined;
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "");
  return tools.find((tool) => tool.href === path);
}

/**
 * Next.js metadata for a tool route. Used by each tool folder's server
 * layout.js, since tool pages are client components and cannot export
 * metadata themselves.
 */
export function getToolMetadata(href) {
  const tool = getToolByHref(href);
  if (!tool) return DEFAULT_TOOLS_METADATA;
  return {
    title: `${tool.title} | UtilHub`,
    description: tool.description,
  };
}

export { DEFAULT_TOOLS_METADATA };

/**
 * Which privacy badges a tool shows, derived from the registry flags.
 * The "client-side" claim is only made when nothing can leave the browser:
 * no AI features and no user-directed network requests.
 *
 * @returns {Array<'client-side' | 'ai-enabled' | 'network'>}
 */
export function getPrivacyVariants(tool) {
  if (!tool) return [];
  const hasAi = tool.hasAiFeatures === true;
  const usesNetwork = tool.usesNetwork === true;
  const variants = [];
  if (tool.isClientSideOnly && !hasAi && !usesNetwork) variants.push("client-side");
  if (hasAi) variants.push("ai-enabled");
  if (usesNetwork) variants.push("network");
  return variants;
}
