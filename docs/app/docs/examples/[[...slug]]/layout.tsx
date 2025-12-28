import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';

/**
 * Notebook layout for example pages.
 * 
 * This provides a more compact layout suitable for code-heavy example pages.
 * The notebook layout is optimized for displaying code examples and test files.
 */
export default function ExamplesLayout({ children }: LayoutProps<'/docs/examples/[[...slug]]'>) {
  const base = baseOptions();
  
  return (
    <DocsLayout
      {...base}
      tree={source.pageTree}
      tabMode="navbar"
      nav={{
        ...base.nav,
        mode: 'top',
      }}
    >
      {children}
    </DocsLayout>
  );
}

