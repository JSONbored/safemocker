'use client';

/**
 * Tabs Component
 *
 * A tabbed interface component for organizing content into multiple panels.
 * This component provides both simple mode (with items array) and advanced mode
 * (with manual Tab components) for maximum flexibility.
 *
 * @fileoverview
 * This component is used throughout the documentation to organize content into
 * tabs, such as code examples for different package managers or different
 * implementation approaches. It integrates with Fumadocs' styling system.
 *
 * @module components/tabs
 * @since 0.2.0
 */

import * as React from 'react';
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { cn } from '../lib/cn';
import * as Unstyled from './ui/tabs';

type CollectionKey = string | symbol;

/**
 * Props for the Tabs component.
 *
 * Extends the base Radix UI Tabs props and adds simplified mode support.
 *
 * @interface TabsProps
 * @extends Omit<ComponentProps<typeof Unstyled.Tabs>, 'value' | 'onValueChange'>
 * @property {string[]} [items] - Array of tab labels for simple mode. When provided, tabs are automatically generated.
 * @property {number} [defaultIndex] - Index of the default active tab when using simple mode (default: 0)
 * @property {ReactNode} [label] - Additional label displayed in the tabs list when using simple mode
 * @category Types
 * @since 0.2.0
 */
export interface TabsProps extends Omit<
  ComponentProps<typeof Unstyled.Tabs>,
  'value' | 'onValueChange'
> {
  /**
   * Use simple mode instead of advanced usage.
   *
   * When provided, the component automatically generates tabs and tab panels
   * based on the items array. This is simpler than manually creating Tab components.
   *
   * @see {@link https://radix-ui.com/primitives/docs/components/tabs} - For advanced usage
   */
  items?: string[];

  /**
   * Shortcut for `defaultValue` when `items` is provided.
   *
   * Specifies which tab should be active by default using the index in the items array.
   *
   * @default 0
   */
  defaultIndex?: number;

  /**
   * Additional label in tabs list when `items` is provided.
   *
   * This label is displayed before the tab triggers, useful for providing context
   * or instructions about the tabs.
   */
  label?: ReactNode;
}

/**
 * Context for sharing tab state between Tabs and Tab components.
 *
 * @internal
 */
const TabsContext = createContext<{
  items?: string[];
  collection: CollectionKey[];
} | null>(null);

/**
 * Hook to access the Tabs context.
 *
 * @throws {Error} Throws if used outside of a Tabs component
 * @returns The Tabs context containing items and collection
 * @internal
 */
function useTabContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('You must wrap your component in <Tabs>');
  return ctx;
}

/**
 * TabsList Component
 *
 * Container component for tab triggers. Provides the visual container and layout
 * for tab buttons. Must be used within a Tabs component.
 *
 * @param props - Props passed to the underlying Radix UI TabsList component
 * @returns A styled tabs list container
 *
 * @example
 * ```tsx
 * <Tabs>
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 * </Tabs>
 * ```
 *
 * @category Components
 * @since 0.2.0
 */
export const TabsList = React.forwardRef<
  React.ComponentRef<typeof Unstyled.TabsList>,
  React.ComponentPropsWithoutRef<typeof Unstyled.TabsList>
>((props, ref) => (
  <Unstyled.TabsList
    ref={ref}
    {...props}
    className={cn(
      'flex gap-3.5 text-fd-secondary-foreground overflow-x-auto px-4 not-prose',
      props.className,
    )}
  />
));
TabsList.displayName = 'TabsList';

/**
 * TabsTrigger Component
 *
 * Individual tab button that activates a tab panel. Must be used within a TabsList.
 * The trigger automatically handles active/inactive states and keyboard navigation.
 *
 * @param props - Props passed to the underlying Radix UI TabsTrigger component
 * @param props.value - The value that identifies this tab (must match corresponding Tab value)
 * @returns A styled tab trigger button
 *
 * @example
 * ```tsx
 * <TabsList>
 *   <TabsTrigger value="overview">Overview</TabsTrigger>
 *   <TabsTrigger value="api">API</TabsTrigger>
 * </TabsList>
 * ```
 *
 * @category Components
 * @since 0.2.0
 */
export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof Unstyled.TabsTrigger>,
  React.ComponentPropsWithoutRef<typeof Unstyled.TabsTrigger>
>((props, ref) => (
  <Unstyled.TabsTrigger
    ref={ref}
    {...props}
    className={cn(
      'inline-flex items-center gap-2 whitespace-nowrap text-fd-muted-foreground border-b border-transparent py-2 text-sm font-medium transition-colors [&_svg]:size-4 hover:text-fd-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-fd-primary data-[state=active]:text-fd-primary',
      props.className,
    )}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

/**
 * Tabs Component
 *
 * Main tabs container component that manages tab state and provides context to child components.
 * Supports both simple mode (with items array) and advanced mode (with manual Tab components).
 *
 * @param props - Component props
 * @param props.items - Array of tab labels for simple mode (optional)
 * @param props.defaultIndex - Default active tab index when using simple mode (default: 0)
 * @param props.label - Additional label displayed in tabs list (optional)
 * @param props.defaultValue - Default active tab value (for advanced mode)
 * @param props.value - Controlled active tab value (for advanced mode)
 * @param props.onValueChange - Callback when active tab changes (for advanced mode)
 * @param props.children - Tab content (Tab components or automatically generated in simple mode)
 * @returns A tabs container component
 *
 * @example
 * ```tsx
 * // Simple mode
 * <Tabs items={['npm', 'pnpm', 'yarn']} defaultIndex={0}>
 *   <Tab>npm install package</Tab>
 *   <Tab>pnpm add package</Tab>
 *   <Tab>yarn add package</Tab>
 * </Tabs>
 * ```
 *
 * @example
 * ```tsx
 * // Advanced mode
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <Tab value="tab1">Content 1</Tab>
 *   <Tab value="tab2">Content 2</Tab>
 * </Tabs>
 * ```
 *
 * @see {@link Tab} - For individual tab content panels
 * @see {@link TabsList} - For the tabs list container
 * @see {@link TabsTrigger} - For individual tab buttons
 * @category Components
 * @since 0.2.0
 */
export function Tabs({
  ref,
  className,
  items,
  label,
  defaultIndex = 0,
  defaultValue = items ? escapeValue(items[defaultIndex]) : undefined,
  ...props
}: TabsProps) {
  const [value, setValue] = useState(defaultValue);
  const collection = useMemo<CollectionKey[]>(() => [], []);

  return (
    <Unstyled.Tabs
      ref={ref}
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border bg-fd-secondary my-4',
        className,
      )}
      value={value}
      onValueChange={(v: string) => {
        if (items && !items.some((item) => escapeValue(item) === v)) return;
        setValue(v);
      }}
      {...props}
    >
      {items && (
        <TabsList>
          {label && (
            <span className="text-sm font-medium my-auto me-auto">{label}</span>
          )}
          {items.map((item) => (
            <TabsTrigger key={item} value={escapeValue(item)}>
              {item}
            </TabsTrigger>
          ))}
        </TabsList>
      )}
      <TabsContext.Provider
        value={useMemo(() => ({ items, collection }), [collection, items])}
      >
        {props.children}
      </TabsContext.Provider>
    </Unstyled.Tabs>
  );
}

/**
 * Props for the Tab component.
 *
 * @interface TabProps
 * @extends Omit<ComponentProps<typeof Unstyled.TabsContent>, 'value'>
 * @property {string} [value] - Value of the tab. If unspecified, detected from index when using simple mode with items array.
 * @category Types
 * @since 0.2.0
 */
export interface TabProps extends Omit<
  ComponentProps<typeof Unstyled.TabsContent>,
  'value'
> {
  /**
   * Value of tab, detected from index if unspecified.
   *
   * When using simple mode with an items array, the value is automatically
   * determined from the tab's position. In advanced mode, you must provide
   * a value that matches a corresponding TabsTrigger.
   */
  value?: string;
}

/**
 * Tab Component
 *
 * Individual tab content panel. Displays content when its corresponding tab trigger is active.
 * Must be used within a Tabs component. In simple mode, the value is automatically
 * determined from the tab's position in the items array.
 *
 * @param props - Component props
 * @param props.value - The value that identifies this tab (optional in simple mode)
 * @param props.children - The content to display when this tab is active
 * @returns A tab content panel
 *
 * @example
 * ```tsx
 * <Tabs items={['npm', 'pnpm']}>
 *   <Tab>npm install package</Tab>
 *   <Tab>pnpm add package</Tab>
 * </Tabs>
 * ```
 *
 * @example
 * ```tsx
 * <Tabs>
 *   <TabsList>
 *     <TabsTrigger value="overview">Overview</TabsTrigger>
 *   </TabsList>
 *   <Tab value="overview">Overview content</Tab>
 * </Tabs>
 * ```
 *
 * @see {@link Tabs} - For the tabs container
 * @category Components
 * @since 0.2.0
 */
export function Tab({ value, ...props }: TabProps) {
  const { items } = useTabContext();
  const resolved =
    value ??
    // eslint-disable-next-line react-hooks/rules-of-hooks -- `value` is not supposed to change
    items?.at(useCollectionIndex());
  if (!resolved)
    throw new Error(
      'Failed to resolve tab `value`, please pass a `value` prop to the Tab component.',
    );

  return (
    <TabsContent value={escapeValue(resolved)} {...props}>
      {props.children}
    </TabsContent>
  );
}

/**
 * TabsContent Component
 *
 * Low-level tab content component. Typically, you should use the `Tab` component
 * instead, which provides automatic value resolution in simple mode.
 *
 * @param props - Props passed to the underlying Radix UI TabsContent component
 * @param props.value - The value that identifies this tab content
 * @returns A tab content panel
 *
 * @internal
 * @category Components
 * @since 0.2.0
 */
export function TabsContent({
  value,
  className,
  ...props
}: ComponentProps<typeof Unstyled.TabsContent>) {
  return (
    <Unstyled.TabsContent
      value={value}
      forceMount
      className={cn(
        'p-4 text-[0.9375rem] bg-fd-background rounded-xl outline-none prose-no-margin data-[state=inactive]:hidden [&>figure:only-child]:-m-4 [&>figure:only-child]:border-none',
        className,
      )}
      {...props}
    >
      {props.children}
    </Unstyled.TabsContent>
  );
}

/**
 * Inspired by Headless UI.
 *
 * Return the index of children, this is made possible by registering the order of render from children using React context.
 * This is supposed by work with pre-rendering & pure client-side rendering.
 */
function useCollectionIndex() {
  const key = useId();
  const { collection } = useTabContext();

  useEffect(() => {
    return () => {
      const idx = collection.indexOf(key);
      if (idx !== -1) collection.splice(idx, 1);
    };
  }, [key, collection]);

  if (!collection.includes(key)) collection.push(key);
  return collection.indexOf(key);
}

/**
 * only escape whitespaces in values in simple mode
 */
function escapeValue(v: string): string {
  return v.toLowerCase().replace(/\s/, '-');
}
