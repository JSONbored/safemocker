'use client';

/**
 * InlineTOC Component
 *
 * A collapsible inline table of contents component for documentation pages.
 * Displays a hierarchical list of page headings that can be expanded/collapsed
 * and provides navigation links to each section.
 *
 * @fileoverview
 * This component is used to display a table of contents within documentation content,
 * allowing users to quickly navigate to different sections of a page. It integrates
 * with Fumadocs' TOC system to automatically generate the heading list.
 *
 * @module components/inline-toc
 * @since 0.2.0
 */

import { ChevronDown } from 'lucide-react';
import type { TOCItemType } from 'fumadocs-core/toc';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/**
 * Props for the InlineTOC component.
 *
 * Extends the Collapsible component props and adds TOC-specific items.
 *
 * @interface InlineTocProps
 * @extends ComponentProps<typeof Collapsible>
 * @property {TOCItemType[]} items - Array of table of contents items (headings) to display
 * @category Types
 * @since 0.2.0
 */
export interface InlineTocProps extends ComponentProps<typeof Collapsible> {
  /** Array of table of contents items (headings) to display */
  items: TOCItemType[];
}

/**
 * InlineTOC Component
 *
 * Renders a collapsible table of contents that displays page headings in a hierarchical
 * structure. Each heading is a clickable link that navigates to the corresponding section.
 * The component automatically handles indentation based on heading depth.
 *
 * @param props - Component props
 * @param props.items - Array of TOC items (headings) to display
 * @param props.children - Optional trigger content (defaults to "Table of Contents")
 * @param props.className - Additional CSS classes
 * @param props.open - Controlled open state
 * @param props.onOpenChange - Callback when open state changes
 * @param props.defaultOpen - Default open state (uncontrolled)
 * @returns A collapsible TOC component
 *
 * @example
 * ```tsx
 * import { InlineTOC } from '@/components/inline-toc';
 * import { useTOC } from 'fumadocs-core/toc';
 *
 * function MyPage() {
 *   const toc = useTOC();
 *
 *   return (
 *     <div>
 *       <InlineTOC items={toc} />
 *       {/* Page content */}
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@link TOCItemType} - For the structure of TOC items
 * @category Components
 * @since 0.2.0
 */
export function InlineTOC({ items, ...props }: InlineTocProps) {
  return (
    <Collapsible
      {...props}
      className={cn(
        'not-prose rounded-lg border bg-fd-card text-fd-card-foreground',
        props.className,
      )}
    >
      <CollapsibleTrigger className="group inline-flex w-full items-center justify-between px-4 py-2.5 font-medium">
        {props.children ?? 'Table of Contents'}
        <ChevronDown className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col p-4 pt-0 text-sm text-fd-muted-foreground">
          {items.map((item) => (
            <a
              key={item.url}
              href={item.url}
              className="border-s py-1.5 hover:text-fd-accent-foreground"
              style={{
                paddingInlineStart: 12 * Math.max(item.depth - 1, 0),
              }}
            >
              {item.title}
            </a>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
