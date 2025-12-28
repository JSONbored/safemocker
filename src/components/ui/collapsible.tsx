'use client';

/**
 * Collapsible Component
 *
 * A collapsible content component that can be expanded and collapsed.
 * Built on top of Radix UI's Collapsible primitive with Fumadocs styling.
 *
 * @fileoverview
 * This component is used throughout the documentation for collapsible sections,
 * such as in the TypeTable component for expanding type details. It provides
 * smooth animations and accessibility features.
 *
 * @module components/ui/collapsible
 * @since 0.2.0
 */

import * as Primitive from '@radix-ui/react-collapsible';
import { forwardRef, useEffect, useState } from 'react';
import { cn } from '../../lib/cn';

/**
 * Collapsible Root Component
 *
 * The root component that manages the collapsible state. Must wrap CollapsibleTrigger
 * and CollapsibleContent components.
 *
 * @example
 * ```tsx
 * <Collapsible>
 *   <CollapsibleTrigger>Toggle</CollapsibleTrigger>
 *   <CollapsibleContent>Content</CollapsibleContent>
 * </Collapsible>
 * ```
 *
 * @see {@link https://www.radix-ui.com/primitives/docs/components/collapsible} - For full API documentation
 * @category Components
 * @since 0.2.0
 */
const Collapsible = Primitive.Root;

/**
 * CollapsibleTrigger Component
 *
 * The button that toggles the collapsible content open/closed.
 *
 * @example
 * ```tsx
 * <CollapsibleTrigger>Click to expand</CollapsibleTrigger>
 * ```
 *
 * @category Components
 * @since 0.2.0
 */
const CollapsibleTrigger = Primitive.CollapsibleTrigger;

/**
 * CollapsibleContent Component
 *
 * The content that is shown/hidden when the collapsible is toggled.
 * Includes smooth animations and proper mounting/unmounting behavior.
 *
 * @param props - Props passed to the underlying Radix UI CollapsibleContent component
 * @param props.children - The content to display when expanded
 * @returns A collapsible content panel with animations
 *
 * @example
 * ```tsx
 * <CollapsibleContent>
 *   <p>This content can be expanded and collapsed.</p>
 * </CollapsibleContent>
 * ```
 *
 * @category Components
 * @since 0.2.0
 */
const CollapsibleContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Primitive.CollapsibleContent>
>(({ children, ...props }, ref) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Primitive.CollapsibleContent
      ref={ref}
      {...props}
      className={cn(
        'overflow-hidden',
        mounted &&
          'data-[state=closed]:animate-fd-collapsible-up data-[state=open]:animate-fd-collapsible-down',
        props.className,
      )}
    >
      {children}
    </Primitive.CollapsibleContent>
  );
});

CollapsibleContent.displayName = Primitive.CollapsibleContent.displayName;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };

/**
 * Type exports for Collapsible component props.
 *
 * @category Types
 * @since 0.2.0
 */
export type CollapsibleProps = Primitive.CollapsibleProps;
export type CollapsibleContentProps = Primitive.CollapsibleContentProps;
export type CollapsibleTriggerProps = Primitive.CollapsibleTriggerProps;
