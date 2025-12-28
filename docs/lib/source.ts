import { docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');
  const slug = Array.isArray(page.slugs) ? page.slugs.join('/') : page.slugs || '';
  const url = `https://safemocker.zeronode.sh/docs/${slug}`;

  return `# ${page.data.title}

${page.data.description ? `**Description:** ${page.data.description}\n\n` : ''}**URL:** ${url}

${processed}

---

*This content is from the safemocker documentation. For more information, visit https://safemocker.zeronode.sh*`;
}
