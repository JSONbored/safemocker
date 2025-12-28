'use client';

import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { Button } from '@/components/button';
import Link from 'next/link';
import { AlertCircle, Home, Search } from 'lucide-react';

/**
 * Error page for documentation.
 * Provides helpful error messages and navigation options.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DocsPage>
      <DocsBody>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
            <AlertCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
          </div>
          
          <div className="space-y-2">
            <DocsTitle>Something went wrong</DocsTitle>
            <p className="text-muted-foreground max-w-md">
              {error.message || 'An unexpected error occurred while loading this page.'}
            </p>
            {error.digest && (
              <p className="text-sm text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={reset} variant="default">
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs">
                <Home className="w-4 h-4 mr-2" />
                Go to Documentation
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a
                href="https://github.com/JSONbored/safemocker/issues/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                Report Issue
              </a>
            </Button>
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg max-w-md">
            <p className="text-sm text-muted-foreground">
              If this problem persists, please{' '}
              <a
                href="https://github.com/JSONbored/safemocker/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                report it on GitHub
              </a>
              {' '}with the error ID above.
            </p>
          </div>
        </div>
      </DocsBody>
    </DocsPage>
  );
}

