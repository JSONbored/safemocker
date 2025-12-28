import { getRSS } from '@/lib/rss';

export const revalidate = 3600; // Revalidate every hour

export async function GET(): Promise<Response> {
  const rss = getRSS();

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

