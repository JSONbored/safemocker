import { source } from '@/lib/source';

// Define Graph type locally if fumadocs-ui/components/graph-view is not available
type Graph = {
  nodes: Array<{
    id: string;
    label: string;
    url: string;
    category?: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
  }>;
};

/**
 * Build a graph of all documentation pages showing their relationships.
 * 
 * This graph is used by the GraphView component to visualize connections
 * between pages, especially useful for showing test/example file relationships.
 * 
 * @returns A graph object containing nodes (pages) and edges (links between pages)
 */
export function buildGraph(): Graph {
  const pages = source.getPages();
  const nodes: Graph['nodes'] = [];
  const edges: Graph['edges'] = [];

  // Create nodes for all pages
  for (const page of pages) {
    const slug = Array.isArray(page.slugs) 
      ? page.slugs.join('/') 
      : String(page.slugs || '');
    const url = typeof slug === 'string' && slug.length > 0 ? `/docs/${slug}` : '/docs';
    
    nodes.push({
      id: url,
      label: typeof page.data.title === 'string' ? page.data.title : String(page.data.title || ''),
      url,
      // Add category based on path
      category: getCategory(slug),
    });
  }

  // Create edges based on link references
  // Fumadocs extracts link references when extractLinkReferences is enabled
  for (const page of pages) {
    const slug = Array.isArray(page.slugs) 
      ? page.slugs.join('/') 
      : String(page.slugs || '');
    const fromUrl = typeof slug === 'string' && slug.length > 0 ? `/docs/${slug}` : '/docs';
    
    // Get link references from page data
    // Note: linkReferences may not be available in all Fumadocs versions
    const linkReferences = (page.data as { linkReferences?: string[] }).linkReferences || [];
    
    for (const linkRef of linkReferences) {
      // Find the target page
      // Convert linkRef to array format if needed
      const linkRefArray = typeof linkRef === 'string' 
        ? linkRef.split('/').filter(Boolean) 
        : Array.isArray(linkRef) 
          ? linkRef 
          : [];
      const targetPage = linkRefArray.length > 0 ? source.getPage(linkRefArray) : null;
      if (targetPage) {
        const targetSlug = Array.isArray(targetPage.slugs)
          ? targetPage.slugs.join('/')
          : String(targetPage.slugs || '');
        const toUrl = typeof targetSlug === 'string' && targetSlug.length > 0 ? `/docs/${targetSlug}` : '/docs';
        
        // Only add edge if both nodes exist
        if (nodes.some((n: { id: string }) => n.id === fromUrl) && nodes.some((n: { id: string }) => n.id === toUrl)) {
          edges.push({
            from: fromUrl,
            to: toUrl,
          });
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Determine the category of a page based on its slug path.
 * 
 * @param slug - The page slug
 * @returns The category name
 */
function getCategory(slug: string | unknown): string {
  const slugStr = typeof slug === 'string' ? slug : String(slug || '');
  if (slugStr.startsWith('examples/')) {
    return 'example';
  }
  if (slugStr.startsWith('api-reference/')) {
    return 'api';
  }
  if (slugStr.startsWith('getting-started/')) {
    return 'getting-started';
  }
  if (slugStr.startsWith('guides/')) {
    return 'guide';
  }
  return 'other';
}

