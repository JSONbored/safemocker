import { getPageImage, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { Feedback } from '@/components/feedback';
import { PDFExportButton } from '@/components/pdf-export-button';
import { LLMCopyButton, ViewOptions } from '@/components/llm-page-actions';
import { RelatedContent } from '@/components/related-content';

// Force dynamic rendering for OpenAPI page to avoid build-time errors
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  const pagePath = Array.isArray(params.slug) ? params.slug.join('/') : params.slug || '';

  // Check if this is the OpenAPI page - handle it specially to avoid build errors
  const isOpenAPIPage = pagePath === 'api-reference/openapi';

  // Construct GitHub URL for the source file
  const githubUrl = `https://github.com/JSONbored/safemocker/blob/main/docs/content/docs/${pagePath}.mdx`;
  const markdownUrl = `/docs/${pagePath}.mdx`;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <div className="flex flex-row gap-2 items-center border-b pt-2 pb-6 mb-4">
        <LLMCopyButton markdownUrl={markdownUrl} />
        <ViewOptions markdownUrl={markdownUrl} githubUrl={githubUrl} />
      </div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex-1">
          <DocsTitle>{page.data.title}</DocsTitle>
          <DocsDescription>{page.data.description}</DocsDescription>
        </div>
        <PDFExportButton slug={pagePath} title={page.data.title} />
      </div>
      <DocsBody>
        {isOpenAPIPage ? (
          <div suppressHydrationWarning>
            <MDX
              components={getMDXComponents({
                a: createRelativeLink(source, page),
              })}
            />
          </div>
        ) : (
          <MDX
            components={getMDXComponents({
              // this allows you to link to other pages with relative file paths
              a: createRelativeLink(source, page),
            })}
          />
        )}
        <RelatedContent page={page} />
        <Feedback pagePath={`/docs/${pagePath}`} pageTitle={page.data.title} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  // Exclude OpenAPI page from static generation to avoid build errors
  const params = source.generateParams();
  return params.filter((param) => {
    const slug = Array.isArray(param.slug) ? param.slug.join('/') : param.slug || '';
    return slug !== 'api-reference/openapi';
  });
}

export async function generateMetadata(
  props: PageProps<'/docs/[[...slug]]'>,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const pagePath = Array.isArray(params.slug) ? params.slug.join('/') : params.slug || '';

  // Generate structured data for FAQPage (troubleshooting pages) and Article (other pages)
  const isTroubleshooting = page.slugs.some((slug) => slug === 'troubleshooting');
  const isGettingStarted = page.slugs.some((slug) => slug === 'getting-started');
  const isExample = page.slugs.some((slug) => slug === 'examples');
  
  // Build Table of Contents structured data if TOC exists
  const tocStructuredData = page.data.toc && page.data.toc.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'TableOfContents',
        about: {
          '@type': 'Article',
          headline: page.data.title,
        },
        itemListElement: page.data.toc.map((item, index: number) => {
          const title = typeof item.title === 'string' ? item.title : String(item.title);
          return {
          '@type': 'ListItem',
          position: index + 1,
            name: title,
            item: `https://safemocker.zeronode.sh/docs/${pagePath}${item.url}`,
          };
        }),
      }
    : null;

  // Build HowTo structured data for step-by-step guides
  const howToStructuredData = isGettingStarted && pagePath.includes('quick-start')
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: page.data.title,
        description: page.data.description || '',
        step: [
          {
            '@type': 'HowToStep',
            name: 'Create Mock File',
            text: 'Create __mocks__/next-safe-action.ts in your project root',
          },
          {
            '@type': 'HowToStep',
            name: 'Create Production safe-action.ts File',
            text: 'Create src/actions/safe-action.ts with your action client configuration',
          },
          {
            '@type': 'HowToStep',
            name: 'Create Actions and Tests',
            text: 'Create your actions and write tests using InferSafeActionFnResult for type safety',
          },
        ],
      }
    : null;

  const structuredData = isTroubleshooting
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Mock Not Working',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Ensure __mocks__/next-safe-action.ts is in your project root and exports: export * from "@jsonbored/safemocker/jest/mock".',
            },
          },
          {
            '@type': 'Question',
            name: 'Type Errors',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Use InferSafeActionFnResult for proper type inference. Don\'t use type assertions (as any).',
            },
          },
          {
            '@type': 'Question',
            name: 'ESM Import Errors',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'This is exactly what safemocker solves! Ensure your mock file is set up correctly and verify Jest is using the mock.',
            },
          },
          {
            '@type': 'Question',
            name: 'Auth Context Not Available',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Use createAuthedActionClient or createCompleteActionClient for auth actions. Verify auth is enabled in your config.',
            },
          },
        ],
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: page.data.title,
        description: page.data.description || '',
        author: {
          '@type': 'Person',
          name: 'JSONbored',
        },
        publisher: {
          '@type': 'Organization',
          name: 'safemocker',
          logo: {
            '@type': 'ImageObject',
            url: 'https://safemocker.zeronode.sh/og-image.png',
          },
        },
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        // Add TableOfContents if available
        ...(tocStructuredData ? { tableOfContents: tocStructuredData } : {}),
        // Add HowTo if this is a step-by-step guide
        ...(howToStructuredData ? { about: howToStructuredData } : {}),
        // Add CodeSample for example pages
        ...(isExample
          ? {
              codeSample: {
                '@type': 'SoftwareSourceCode',
                codeRepository: 'https://github.com/JSONbored/safemocker',
                programmingLanguage: 'TypeScript',
                runtimePlatform: 'Node.js',
              },
            }
          : {}),
      };

  const canonicalUrl = `https://safemocker.zeronode.sh/docs/${pagePath}`;

  // Build breadcrumb list for structured data
  const breadcrumbItems: Array<{ name: string; url: string }> = [
    { name: 'Home', url: 'https://safemocker.zeronode.sh' },
    { name: 'Documentation', url: 'https://safemocker.zeronode.sh/docs' },
  ];

  // Add intermediate breadcrumb items based on slug path
  if (pagePath && typeof pagePath === 'string') {
    const pathParts = pagePath.split('/');
    let currentPath = '';
    for (const part of pathParts) {
      if (typeof part === 'string') {
      currentPath += (currentPath ? '/' : '') + part;
      const partName = part
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbItems.push({
        name: partName,
        url: `https://safemocker.zeronode.sh/docs/${currentPath}`,
      });
      }
    }
  }

  // Create breadcrumb structured data
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  // Combine structured data (only include items with @context)
  const graphItems: Array<Record<string, unknown>> = [structuredData, breadcrumbStructuredData];
  if (tocStructuredData && '@context' in tocStructuredData) {
    graphItems.push(tocStructuredData);
  }
  if (howToStructuredData && '@context' in howToStructuredData) {
    graphItems.push(howToStructuredData);
  }
  
  const combinedStructuredData = {
    '@context': 'https://schema.org',
    '@graph': graphItems,
  };

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      images: getPageImage(page).url,
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
    },
    other: {
      'application/ld+json': JSON.stringify(combinedStructuredData),
    },
  };
}
