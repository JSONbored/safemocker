import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { Provider } from '@/components/provider';
import { Banner } from '@/components/banner';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'safemocker - Type-safe mock for next-safe-action',
    template: '%s | safemocker',
  },
  description: 'Type-safe, Jest & Vitest-compatible mock for next-safe-action. Replicates real middleware behavior and returns proper SafeActionResult structure.',
  keywords: ['next-safe-action', 'mock', 'testing', 'jest', 'vitest', 'type-safe', 'server-actions', 'typescript'],
  authors: [{ name: 'JSONbored' }],
  creator: 'JSONbored',
  publisher: 'JSONbored',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://safemocker.zeronode.sh',
    siteName: 'safemocker',
    title: 'safemocker - Type-safe mock for next-safe-action',
    description: 'Type-safe, Jest & Vitest-compatible mock for next-safe-action',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'safemocker - Type-safe mock for next-safe-action',
    description: 'Type-safe, Jest & Vitest-compatible mock for next-safe-action',
    creator: '@JSONbored',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL('https://safemocker.zeronode.sh'),
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [
        {
          title: 'safemocker Documentation',
          url: 'https://safemocker.zeronode.sh/rss.xml',
        },
      ],
    },
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'safemocker',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Any',
              description: 'Type-safe, Jest & Vitest-compatible mock for next-safe-action. Replicates real middleware behavior and returns proper SafeActionResult structure.',
              url: 'https://safemocker.zeronode.sh',
              author: {
                '@type': 'Person',
                name: 'JSONbored',
                url: 'https://github.com/JSONbored',
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              },
              codeRepository: 'https://github.com/JSONbored/safemocker',
              downloadUrl: 'https://www.npmjs.com/package/@jsonbored/safemocker',
              softwareVersion: '0.2.0',
              keywords: 'next-safe-action, mock, testing, jest, vitest, type-safe, server-actions, typescript',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '5',
                ratingCount: '1',
              },
              featureList: [
                'Type-safe testing',
                'Jest compatibility',
                'Vitest compatibility',
                'Middleware support',
                'Authentication mocking',
                'Validation error handling',
              ],
            }),
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <Provider>
          <Banner id="docs-announcement" changeLayout={true}>
            safemocker - Type-safe mock for next-safe-action
          </Banner>
          {children}
        </Provider>
      </body>
    </html>
  );
}
