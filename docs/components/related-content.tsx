import Link from 'next/link';
import { getRelatedPages } from '@/lib/related-content';
import { source } from '@/lib/source';
import type { InferPageType } from 'fumadocs-core/source';
import { Card, Cards } from 'fumadocs-ui/components/card';

/**
 * Related content component.
 * 
 * Displays related documentation pages based on category and content similarity.
 * 
 * @param page - The current page to find related content for
 * @param limit - Maximum number of related pages to show (default: 3)
 */
export function RelatedContent({
  page,
  limit = 3,
}: {
  page: InferPageType<typeof source>;
  limit?: number;
}) {
  const relatedPages = getRelatedPages(page, limit);
  
  if (relatedPages.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-semibold mb-4">Related Documentation</h2>
      <Cards>
        {relatedPages.map((relatedPage) => {
          const slug = Array.isArray(relatedPage.slugs)
            ? relatedPage.slugs.join('/')
            : String(relatedPage.slugs || '');
          const url = typeof slug === 'string' && slug.length > 0 ? `/docs/${slug}` : '/docs';
          
          const title = typeof relatedPage.data.title === 'string' 
            ? relatedPage.data.title 
            : String(relatedPage.data.title || '');
          const description = typeof relatedPage.data.description === 'string'
            ? relatedPage.data.description
            : String(relatedPage.data.description || '');
          
          return (
            <Card
              key={url}
              title={title}
              description={description}
              href={url}
            />
          );
        })}
      </Cards>
    </div>
  );
}

