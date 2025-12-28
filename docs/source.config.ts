import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkDirective from 'remark-directive';
import { remarkMdxFiles } from 'fumadocs-core/mdx-plugins';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeCodeTitles from 'rehype-code-titles';
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis';

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
      // Enable link reference extraction for Graph View
      extractLinkReferences: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      // GitHub Flavored Markdown support (tables, strikethrough, task lists)
      remarkGfm,
      // Convert files code blocks into MDX Files component
      remarkMdxFiles,
      // Better line break handling
      remarkBreaks,
      // Custom directive support
      // Note: Footnote support is included in remark-gfm above
      remarkDirective,
    ],
    rehypePlugins: [
      // Auto-generate heading IDs for anchor links
      rehypeSlug,
      // Auto-link headings for better navigation
      // Use 'append' instead of 'wrap' to avoid nested anchor tags
      // Fumadocs Heading component already provides anchor links
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: {
            className: ['anchor'],
            ariaLabel: 'Link to section',
          },
        },
      ],
      // Mark external links with target="_blank" and rel="noopener noreferrer"
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noopener', 'noreferrer'],
        },
      ],
      // Add titles to code blocks
      rehypeCodeTitles,
      // Make emojis accessible with proper ARIA labels
      rehypeAccessibleEmojis,
      // Shiki syntax highlighting is handled automatically by Fumadocs
    ],
  },
});
