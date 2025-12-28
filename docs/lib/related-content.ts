import { source } from '@/lib/source';
import type { InferPageType } from 'fumadocs-core/source';

/**
 * Find related pages based on tags, categories, and path similarity.
 * 
 * @param currentPage - The current page to find related content for
 * @param limit - Maximum number of related pages to return (default: 3)
 * @returns Array of related pages
 */
export function getRelatedPages(
  currentPage: InferPageType<typeof source>,
  limit: number = 3
): Array<InferPageType<typeof source>> {
  const allPages = source.getPages();
  const currentSlug = Array.isArray(currentPage.slugs)
    ? currentPage.slugs.join('/')
    : String(currentPage.slugs || '');
  
  // Extract category from slug (first part)
  const currentCategory = typeof currentSlug === 'string' ? currentSlug.split('/')[0] || '' : '';
  
  // Score pages based on relevance
  const scoredPages = allPages
    .filter((page) => {
      const pageSlug = Array.isArray(page.slugs)
        ? page.slugs.join('/')
        : String(page.slugs || '');
      // Exclude current page
      return pageSlug !== currentSlug;
    })
    .map((page) => {
      const pageSlug = Array.isArray(page.slugs)
        ? page.slugs.join('/')
        : String(page.slugs || '');
      const pageCategory = typeof pageSlug === 'string' ? pageSlug.split('/')[0] || '' : '';
      
      let score = 0;
      
      // Same category gets higher score
      if (pageCategory === currentCategory) {
        score += 10;
      }
      
      // Path similarity (shared path segments)
      const currentParts = typeof currentSlug === 'string' ? currentSlug.split('/') : [];
      const pageParts = typeof pageSlug === 'string' ? pageSlug.split('/') : [];
      const sharedParts = currentParts.filter((part) => pageParts.includes(part));
      score += sharedParts.length * 2;
      
      // Title similarity (simple keyword matching)
      const currentTitle = typeof currentPage.data.title === 'string' 
        ? currentPage.data.title 
        : String(currentPage.data.title || '');
      const pageTitle = typeof page.data.title === 'string'
        ? page.data.title
        : String(page.data.title || '');
      const currentTitleWords = currentTitle.toLowerCase().split(/\s+/);
      const pageTitleWords = pageTitle.toLowerCase().split(/\s+/);
      const commonWords = currentTitleWords.filter((word) =>
        pageTitleWords.includes(word)
      );
      score += commonWords.length;
      
      return { page, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.page);
  
  return scoredPages;
}

/**
 * Get next and previous pages based on page tree order.
 * 
 * @param currentPage - The current page
 * @returns Object with next and previous pages, if available
 */
export function getAdjacentPages(currentPage: InferPageType<typeof source>): {
  next?: InferPageType<typeof source>;
  previous?: InferPageType<typeof source>;
} {
  const allPages = source.getPages();
  const currentSlug = Array.isArray(currentPage.slugs)
    ? currentPage.slugs.join('/')
    : String(currentPage.slugs || '');
  
  const currentIndex = allPages.findIndex((page) => {
    const pageSlug = Array.isArray(page.slugs)
      ? page.slugs.join('/')
      : String(page.slugs || '');
    return pageSlug === currentSlug;
  });
  
  if (currentIndex === -1) {
    return {};
  }
  
  return {
    next: allPages[currentIndex + 1],
    previous: allPages[currentIndex - 1],
  };
}

