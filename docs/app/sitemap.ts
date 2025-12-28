import { source } from '@/lib/source';
import { MetadataRoute } from 'next';
import { statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Get file modification date from filesystem.
 * Falls back to current date if file doesn't exist.
 */
function getFileModificationDate(filePath: string): Date {
  try {
    const stats = statSync(filePath);
    return stats.mtime;
  } catch {
    return new Date();
  }
}

/**
 * Calculate priority based on page depth and type.
 */
function calculatePriority(url: string, slug: string[]): number {
  // Homepage and main docs page
  if (url === '/' || url === '/docs') {
    return 1.0;
  }
  
  // Getting started pages are high priority
  if (slug[0] === 'getting-started') {
    return 0.9;
  }
  
  // API reference pages
  if (slug[0] === 'api-reference') {
    return 0.8;
  }
  
  // Example pages
  if (slug[0] === 'examples') {
    return 0.7;
  }
  
  // Guide pages
  if (slug[0] === 'guides') {
    return 0.6;
  }
  
  // Deeper pages have lower priority
  const depth = slug.length;
  return Math.max(0.3, 0.9 - depth * 0.1);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://safemocker.zeronode.sh';
  const contentDir = resolve(process.cwd(), 'content/docs');
  
  // Get all page params from source
  const params = source.generateParams();
  
  // Convert params to sitemap entries
  const pages = params.map((param) => {
    const slug = Array.isArray(param.slug) ? param.slug : [param.slug];
    const url = slug.length > 0 ? `/docs/${slug.join('/')}` : '/docs';
    
    // Get actual file modification date
    const filePath = join(contentDir, slug.length > 0 ? `${slug.join('/')}.mdx` : 'index.mdx');
    const lastModified = getFileModificationDate(filePath);
    const priority = calculatePriority(url, slug);
    
    // Determine change frequency based on page type
    let changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'weekly';
    if (slug[0] === 'api-reference') {
      changeFrequency = 'monthly'; // API docs change less frequently
    } else if (slug[0] === 'examples') {
      changeFrequency = 'monthly';
    } else if (slug[0] === 'getting-started') {
      changeFrequency = 'weekly';
    }
    
    return {
      url: `${baseUrl}${url}`,
      lastModified,
      changeFrequency,
      priority,
    };
  });

  // Add homepage and RSS feed
  const homepagePath = resolve(process.cwd(), 'app/(home)/page.tsx');
  const rssPath = resolve(process.cwd(), 'app/rss.xml/route.ts');
  
  return [
    {
      url: baseUrl,
      lastModified: getFileModificationDate(homepagePath),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/rss.xml`,
      lastModified: getFileModificationDate(rssPath),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    ...pages,
  ];
}

