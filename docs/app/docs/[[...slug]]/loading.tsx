import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';

/**
 * Loading state for documentation pages.
 * Shows skeleton loaders while content is being fetched.
 */
export default function Loading() {
  return (
    <DocsPage>
      <div className="flex flex-row gap-2 items-center border-b pt-2 pb-6 mb-4">
        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
        <div className="h-8 w-24 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex-1 space-y-2">
          <DocsTitle>
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          </DocsTitle>
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
      </div>
      <DocsBody>
        <div className="space-y-4">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
          <div className="h-4 w-4/6 bg-muted animate-pulse rounded" />
          <div className="h-32 w-full bg-muted animate-pulse rounded mt-6" />
          <div className="h-4 w-full bg-muted animate-pulse rounded mt-4" />
          <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
        </div>
      </DocsBody>
    </DocsPage>
  );
}

