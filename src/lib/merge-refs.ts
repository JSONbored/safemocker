/**
 * Utility function for merging multiple React refs into a single ref callback.
 *
 * This utility is useful when a component needs to forward a ref while also
 * maintaining its own internal ref, or when multiple refs need to be attached
 * to the same DOM element. It handles both function refs and object refs (RefObject).
 *
 * The returned callback can be used directly as a ref prop, and it will call
 * all provided refs with the element value. This is commonly used in component
 * libraries that need to forward refs while maintaining internal refs.
 *
 * @template T - The type of element the refs reference
 * @param refs - Variable number of ref arguments (function refs, RefObjects, or undefined)
 * @returns A ref callback function that applies all refs to the element
 *
 * @example
 * ```tsx
 * import { mergeRefs } from '@/lib/merge-refs';
 * import { useRef, forwardRef } from 'react';
 *
 * const MyComponent = forwardRef<HTMLDivElement, Props>((props, forwardedRef) => {
 *   const internalRef = useRef<HTMLDivElement>(null);
 *
 *   return (
 *     <div ref={mergeRefs(forwardedRef, internalRef)}>
 *       {/* Component content */}
 *     </div>
 *   );
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Multiple refs
 * const ref1 = useRef<HTMLInputElement>(null);
 * const ref2 = useRef<HTMLInputElement>(null);
 * const ref3 = (element: HTMLInputElement | null) => {
 *   console.log('Element:', element);
 * };
 *
 * <input ref={mergeRefs(ref1, ref2, ref3)} />
 * ```
 *
 * @remarks
 * - Function refs are called directly with the element value
 * - Object refs (RefObject) have their `current` property set
 * - Undefined refs are safely ignored
 * - The order of refs matters - all refs are applied in the order provided
 *
 * @category Utilities
 * @since 0.2.0
 */
import type * as React from 'react';

export function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref) {
        ref.current = value;
      }
    });
  };
}
