import { Feed } from 'feed';
import { source } from '@/lib/source';

const baseUrl = 'https://safemocker.zeronode.sh';

/**
 * Generate RSS feed for documentation pages
 * 
 * @returns RSS 2.0 formatted XML string
 */
export function getRSS() {
  const feed = new Feed({
    title: 'safemocker Documentation',
    id: `${baseUrl}/docs`,
    link: `${baseUrl}/docs`,
    language: 'en',
    description: 'Type-safe, Jest & Vitest-compatible mock for next-safe-action. Complete API documentation, guides, and examples.',
    image: `${baseUrl}/og-image.png`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, JSONbored`,
    updated: new Date(),
    generator: 'safemocker-docs',
    feedLinks: {
      rss: `${baseUrl}/rss.xml`,
    },
    author: {
      name: 'JSONbored',
      link: 'https://github.com/JSONbored',
    },
  });

  // Add all documentation pages to the feed
  for (const page of source.getPages()) {
    const slug = Array.isArray(page.slugs) ? page.slugs.join('/') : page.slugs || '';
    const url = slug.length > 0 ? `${baseUrl}/docs/${slug}` : `${baseUrl}/docs`;
    
    feed.addItem({
      id: url,
      title: page.data.title,
      description: page.data.description || '',
      link: url,
      date: new Date(), // Use current date since lastModified is not available in page data
      author: [
        {
          name: 'JSONbored',
          link: 'https://github.com/JSONbored',
        },
      ],
    });
  }

  return feed.rss2();
}

