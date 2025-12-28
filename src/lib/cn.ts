/**
 * Utility function for merging Tailwind CSS class names.
 *
 * This is a re-export of `twMerge` from `tailwind-merge`, providing a convenient
 * utility for conditionally merging Tailwind CSS classes while resolving conflicts
 * intelligently. When conflicting classes are provided, `twMerge` keeps the last
 * one that makes sense (e.g., `twMerge('p-2 p-4')` returns `'p-4'`).
 *
 * The function is commonly aliased as `cn` (class names) for brevity and follows
 * the pattern used in shadcn/ui and other modern React component libraries.
 *
 * @param classes - Variable number of class name arguments (strings, arrays, objects, or undefined)
 * @returns A merged string of class names with conflicts resolved
 *
 * @example
 * ```typescript
 * import { cn } from '@/lib/cn';
 *
 * // Basic usage
 * const className = cn('p-2', 'bg-blue-500');
 * // Returns: 'p-2 bg-blue-500'
 *
 * // Conditional classes
 * const className = cn('p-2', isActive && 'bg-blue-500', 'rounded');
 * // Returns: 'p-2 bg-blue-500 rounded' (if isActive is true)
 *
 * // Resolving conflicts
 * const className = cn('p-2', 'p-4');
 * // Returns: 'p-4' (last conflicting class wins)
 *
 * // With arrays and objects
 * const className = cn(['p-2', 'bg-blue-500'], { 'rounded': true });
 * // Returns: 'p-2 bg-blue-500 rounded'
 * ```
 *
 * @see {@link https://github.com/dcastil/tailwind-merge} - For full documentation
 * @category Utilities
 * @since 0.2.0
 */
export { twMerge as cn } from 'tailwind-merge';
