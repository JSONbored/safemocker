'use client';

/**
 * Tabs UI Component (Low-level)
 *
 * Low-level tabs component built on Radix UI with additional features:
 * - Tab group synchronization via groupId
 * - Persistent tab state via localStorage/sessionStorage
 * - URL hash synchronization
 *
 * @fileoverview
 * This is the underlying tabs implementation used by the higher-level Tabs component.
 * It provides advanced features like tab group synchronization and persistence.
 *
 * @module components/ui/tabs
 * @since 0.2.0
 */

import {
  type ComponentProps,
  createContext,
  use,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Primitive from '@radix-ui/react-tabs';
import { mergeRefs } from '../../lib/merge-refs';

type ChangeListener = (v: string) => void;
const listeners = new Map<string, Set<ChangeListener>>();

/**
 * Props for the low-level Tabs component.
 *
 * Extends Radix UI Tabs props with additional features for tab synchronization and persistence.
 *
 * @interface TabsProps
 * @extends ComponentProps<typeof Primitive.Tabs>
 * @property {string} [groupId] - Identifier for sharing tab state across multiple Tabs instances. Tabs with the same groupId will synchronize their active state.
 * @property {boolean} [persist] - If true, persists tab state to localStorage (in addition to sessionStorage). Default: false (only sessionStorage)
 * @property {boolean} [updateAnchor] - If true, updates the URL hash based on the tab's id when the active tab changes. Default: false
 * @category Types
 * @since 0.2.0
 */
export interface TabsProps extends ComponentProps<typeof Primitive.Tabs> {
  /**
   * Identifier for sharing value of tabs across multiple instances.
   *
   * When multiple Tabs components share the same groupId, they will synchronize
   * their active tab state. Changing the active tab in one instance will update
   * all other instances with the same groupId.
   *
   * @example
   * ```tsx
   * // These two Tabs will stay in sync
   * <Tabs groupId="package-manager" defaultValue="npm">...</Tabs>
   * <Tabs groupId="package-manager" defaultValue="npm">...</Tabs>
   * ```
   */
  groupId?: string;

  /**
   * Enable persistent tab state.
   *
   * When true, the active tab state is persisted to localStorage (in addition
   * to sessionStorage). This means the tab selection will persist across browser
   * sessions. When false, only sessionStorage is used (persists within the session).
   *
   * @default false
   */
  persist?: boolean;

  /**
   * If true, updates the URL hash based on the tab's id.
   *
   * When a tab is activated, the URL hash is updated to match the tab's id.
   * This allows users to link directly to specific tabs and enables browser
   * back/forward navigation between tabs.
   *
   * @default false
   */
  updateAnchor?: boolean;
}

/**
 * Context for sharing tab value-to-id mapping.
 *
 * @internal
 */
const TabsContext = createContext<{
  valueToIdMap: Map<string, string>;
} | null>(null);

/**
 * Hook to access the Tabs context.
 *
 * @throws {Error} Throws if used outside of a Tabs component
 * @returns The Tabs context containing valueToIdMap
 * @internal
 */
function useTabContext() {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error('You must wrap your component in <Tabs>');
  return ctx;
}

/**
 * TabsList Component (Low-level)
 *
 * Container for tab triggers. Re-exported from Radix UI.
 *
 * @category Components
 * @since 0.2.0
 */
export const TabsList = Primitive.TabsList;

/**
 * TabsTrigger Component (Low-level)
 *
 * Individual tab button. Re-exported from Radix UI.
 *
 * @category Components
 * @since 0.2.0
 */
export const TabsTrigger = Primitive.TabsTrigger;

/**
 * Tabs Component (Low-level)
 *
 * Main tabs container with advanced features:
 * - Tab group synchronization (groupId)
 * - Persistent state (persist)
 * - URL hash synchronization (updateAnchor)
 *
 * @param props - Component props
 * @param props.groupId - Identifier for tab group synchronization
 * @param props.persist - Enable localStorage persistence
 * @param props.updateAnchor - Update URL hash on tab change
 * @param props.defaultValue - Default active tab value (uncontrolled)
 * @param props.value - Controlled active tab value
 * @param props.onValueChange - Callback when active tab changes
 * @param props.children - Tab content
 * @returns A tabs container with advanced synchronization features
 *
 * @example
 * ```tsx
 * // Synchronized tabs
 * <Tabs groupId="package-manager" persist>
 *   <TabsList>
 *     <TabsTrigger value="npm">npm</TabsTrigger>
 *     <TabsTrigger value="pnpm">pnpm</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="npm">npm install</TabsContent>
 *   <TabsContent value="pnpm">pnpm add</TabsContent>
 * </Tabs>
 * ```
 *
 * @see {@link https://www.radix-ui.com/primitives/docs/components/tabs} - For base Radix UI API
 * @category Components
 * @since 0.2.0
 */
export function Tabs({
  ref,
  groupId,
  persist = false,
  updateAnchor = false,
  defaultValue,
  value: _value,
  onValueChange: _onValueChange,
  ...props
}: TabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const valueToIdMap = useMemo(() => new Map<string, string>(), []);
  const [value, setValue] =
    _value === undefined
      ? // eslint-disable-next-line react-hooks/rules-of-hooks -- not supposed to change controlled/uncontrolled
        useState(defaultValue)
      : // eslint-disable-next-line react-hooks/rules-of-hooks -- not supposed to change controlled/uncontrolled
        [_value, useEffectEvent((v: string) => _onValueChange?.(v))];

  useLayoutEffect(() => {
    if (!groupId) return;
    let previous = sessionStorage.getItem(groupId);
    if (persist) previous ??= localStorage.getItem(groupId);
    if (previous) setValue(previous);

    const groupListeners = listeners.get(groupId) ?? new Set();
    groupListeners.add(setValue);
    listeners.set(groupId, groupListeners);
    return () => {
      groupListeners.delete(setValue);
    };
  }, [groupId, persist, setValue]);

  useLayoutEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    for (const [value, id] of valueToIdMap.entries()) {
      if (id === hash) {
        setValue(value);
        tabsRef.current?.scrollIntoView();
        break;
      }
    }
  }, [setValue, valueToIdMap]);

  return (
    <Primitive.Tabs
      ref={mergeRefs(ref, tabsRef)}
      value={value}
      onValueChange={(v: string) => {
        if (updateAnchor) {
          const id = valueToIdMap.get(v);

          if (id) {
            window.history.replaceState(null, '', `#${id}`);
          }
        }

        if (groupId) {
          const groupListeners = listeners.get(groupId);
          if (groupListeners) {
            for (const listener of groupListeners) listener(v);
          }

          sessionStorage.setItem(groupId, v);
          if (persist) localStorage.setItem(groupId, v);
        } else {
          setValue(v);
        }
      }}
      {...props}
    >
      <TabsContext value={useMemo(() => ({ valueToIdMap }), [valueToIdMap])}>
        {props.children}
      </TabsContext>
    </Primitive.Tabs>
  );
}

/**
 * TabsContent Component (Low-level)
 *
 * Individual tab content panel. Displays content when its corresponding tab trigger is active.
 * Automatically registers the tab's id for URL hash synchronization when updateAnchor is enabled.
 *
 * @param props - Props passed to the underlying Radix UI TabsContent component
 * @param props.value - The value that identifies this tab content
 * @param props.id - Optional id for URL hash synchronization (used when updateAnchor is true)
 * @param props.children - The content to display when this tab is active
 * @returns A tab content panel
 *
 * @example
 * ```tsx
 * <Tabs updateAnchor>
 *   <TabsList>
 *     <TabsTrigger value="overview">Overview</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="overview" id="overview">
 *     Overview content
 *   </TabsContent>
 * </Tabs>
 * ```
 *
 * @category Components
 * @since 0.2.0
 */
export function TabsContent({
  value,
  ...props
}: ComponentProps<typeof Primitive.TabsContent>) {
  const { valueToIdMap } = useTabContext();

  if (props.id) {
    valueToIdMap.set(value, props.id);
  }

  return (
    <Primitive.TabsContent value={value} {...props}>
      {props.children}
    </Primitive.TabsContent>
  );
}
