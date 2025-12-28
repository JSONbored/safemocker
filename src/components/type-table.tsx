'use client';

/**
 * TypeTable Component
 *
 * A collapsible table component for displaying TypeScript type information in documentation.
 * This component is used by Fumadocs to render auto-generated type tables from TypeScript source files.
 *
 * @fileoverview
 * This component provides a responsive, collapsible interface for displaying type definitions
 * with properties, types, descriptions, defaults, and parameter information. It's designed
 * to work seamlessly with Fumadocs' auto-type-table feature.
 *
 * @module components/type-table
 * @since 0.2.0
 */

import { ChevronDown } from 'lucide-react';
import Link from 'fumadocs-core/link';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { type ReactNode, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

/**
 * Represents a function parameter in a type definition.
 *
 * @interface ParameterNode
 * @property {string} name - The parameter name
 * @property {ReactNode} description - The parameter description (supports markdown/JSX)
 * @category Types
 * @since 0.2.0
 */
export interface ParameterNode {
  /** The parameter name */
  name: string;
  /** The parameter description (supports markdown/JSX) */
  description: ReactNode;
}

/**
 * Represents a type field/property in a type definition table.
 *
 * This interface defines all the metadata that can be displayed for a single property
 * in a TypeTable. It supports rich descriptions, type information, defaults, and
 * function parameter details.
 *
 * @interface TypeNode
 * @property {ReactNode} [description] - Additional description of the field (supports markdown/JSX)
 * @property {ReactNode} type - Type signature (short form, displayed in collapsed state)
 * @property {ReactNode} [typeDescription] - Full type signature (displayed when expanded)
 * @property {string} [typeDescriptionLink] - Optional href for linking to type documentation
 * @property {ReactNode} [default] - Default value for the field
 * @property {boolean} [required] - Whether the field is required (default: false)
 * @property {boolean} [deprecated] - Whether the field is deprecated (default: false)
 * @property {ParameterNode[]} [parameters] - Function parameters (for function types)
 * @property {ReactNode} [returns] - Return type description (for function types)
 * @category Types
 * @since 0.2.0
 */
export interface TypeNode {
  /**
   * Additional description of the field.
   * Supports markdown and React components for rich formatting.
   */
  description?: ReactNode;

  /**
   * Type signature (short form).
   * Displayed in the collapsed state of the table row.
   */
  type: ReactNode;

  /**
   * Type signature (full form).
   * Displayed when the row is expanded, providing complete type information.
   */
  typeDescription?: ReactNode;

  /**
   * Optional href for linking to type documentation.
   * When provided, the type becomes a clickable link.
   */
  typeDescriptionLink?: string;

  /**
   * Default value for the field.
   * Displayed when the row is expanded.
   */
  default?: ReactNode;

  /**
   * Whether the field is required.
   * When false, the field name is displayed with a '?' suffix.
   * @default false
   */
  required?: boolean;

  /**
   * Whether the field is deprecated.
   * Deprecated fields are displayed with strikethrough styling.
   * @default false
   */
  deprecated?: boolean;

  /**
   * Function parameters (for function types).
   * Each parameter includes a name and description.
   */
  parameters?: ParameterNode[];

  /**
   * Return type description (for function types).
   * Supports markdown and React components.
   */
  returns?: ReactNode;
}

/**
 * Style variants for the property name/key in the type table.
 *
 * @internal
 */
const keyVariants = cva('text-fd-primary', {
  variants: {
    deprecated: {
      true: 'line-through text-fd-primary/50',
    },
  },
});

/**
 * Style variants for field labels in the expanded view.
 *
 * @internal
 */
const fieldVariants = cva('text-fd-muted-foreground not-prose pe-2');

/**
 * TypeTable Component
 *
 * Renders a collapsible table displaying TypeScript type information. Each property
 * in the type is displayed as a collapsible row that can be expanded to show detailed
 * information including full type signatures, descriptions, defaults, and parameters.
 *
 * The component is responsive and uses container queries to hide the type column
 * on smaller screens. It integrates seamlessly with Fumadocs' auto-type-table feature.
 *
 * @param props - Component props
 * @param props.type - Record mapping property names to TypeNode objects containing type metadata
 * @returns A React component rendering the type table
 *
 * @example
 * ```tsx
 * import { TypeTable } from '@/components/type-table';
 *
 * const typeInfo = {
 *   name: {
 *     type: 'string',
 *     description: 'The name of the user',
 *     required: true,
 *   },
 *   age: {
 *     type: 'number',
 *     description: 'The age of the user',
 *     default: 18,
 *     required: false,
 *   },
 * };
 *
 * <TypeTable type={typeInfo} />
 * ```
 *
 * @see {@link TypeNode} - For the structure of type metadata
 * @see {@link ParameterNode} - For function parameter information
 * @category Components
 * @since 0.2.0
 */
export function TypeTable({ type }: { type: Record<string, TypeNode> }) {
  return (
    <div className="@container flex flex-col p-1 bg-fd-card text-fd-card-foreground rounded-2xl border my-6 text-sm overflow-hidden">
      <div className="flex font-medium items-center px-3 py-1 not-prose text-fd-muted-foreground">
        <p className="w-[25%]">Prop</p>
        <p className="@max-xl:hidden">Type</p>
      </div>
      {Object.entries(type).map(([key, value]) => (
        <Item key={key} name={key} item={value} />
      ))}
    </div>
  );
}

/**
 * Individual type table row/item component.
 *
 * Renders a collapsible row for a single property in the type table.
 * The row shows the property name and short type in collapsed state,
 * and expands to show full type information, description, defaults, and parameters.
 *
 * @param props - Component props
 * @param props.name - The property name
 * @param props.item - The TypeNode containing all metadata for this property
 * @returns A collapsible row component
 *
 * @internal
 */
function Item({
  name,
  item: {
    parameters = [],
    description,
    required = false,
    deprecated,
    typeDescription,
    default: defaultValue,
    type,
    typeDescriptionLink,
    returns,
  },
}: {
  name: string;
  item: TypeNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        'rounded-xl border overflow-hidden transition-all',
        open
          ? 'shadow-sm bg-fd-background not-last:mb-2'
          : 'border-transparent',
      )}
    >
      <CollapsibleTrigger className="relative flex flex-row items-center w-full group text-start px-3 py-2 not-prose hover:bg-fd-accent">
        <code
          className={cn(
            keyVariants({
              deprecated,
              className: 'min-w-fit w-[25%] font-medium pe-2',
            }),
          )}
        >
          {name}
          {!required && '?'}
        </code>
        {typeDescriptionLink ? (
          <Link href={typeDescriptionLink} className="underline @max-xl:hidden">
            {type}
          </Link>
        ) : (
          <span className="@max-xl:hidden">{type}</span>
        )}
        <ChevronDown className="absolute end-2 size-4 text-fd-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-[1fr_3fr] gap-y-4 text-sm p-3 overflow-auto fd-scroll-container border-t">
          <div className="text-sm prose col-span-full prose-no-margin empty:hidden">
            {description}
          </div>
          {typeDescription && (
            <>
              <p className={cn(fieldVariants())}>Type</p>
              <p className="my-auto not-prose">{typeDescription}</p>
            </>
          )}
          {defaultValue && (
            <>
              <p className={cn(fieldVariants())}>Default</p>
              <p className="my-auto not-prose">{defaultValue}</p>
            </>
          )}
          {parameters.length > 0 && (
            <>
              <p className={cn(fieldVariants())}>Parameters</p>
              <div className="flex flex-col gap-2">
                {parameters.map((param) => (
                  <div
                    key={param.name}
                    className="inline-flex items-center flex-wrap gap-1"
                  >
                    <p className="font-medium not-prose text-nowrap">
                      {param.name} -
                    </p>
                    <div className="text-sm prose prose-no-margin">
                      {param.description}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {returns && (
            <>
              <p className={cn(fieldVariants())}>Returns</p>
              <div className="my-auto text-sm prose prose-no-margin">
                {returns}
              </div>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
