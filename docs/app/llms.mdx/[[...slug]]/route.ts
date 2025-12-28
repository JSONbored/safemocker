import { getLLMText, source } from '@/lib/source';
import { notFound } from 'next/navigation';

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<'/llms.mdx/[[...slug]]'>,
) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const markdown = await getLLMText(page);

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}

export async function generateStaticParams() {
  return source.generateParams();
}

