import dynamic from 'next/dynamic';
import { buildGraph } from '@/lib/build-graph';

// Define Graph type locally
type Graph = {
  nodes: Array<{
    id: string;
    label: string;
    url: string;
    category?: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
  }>;
};

// Lazy load GraphView component for better performance
// Note: fumadocs-ui/components/graph-view may not be available in all versions
// We'll use a type-safe approach with proper error handling
// Using a type assertion to handle the missing module gracefully
const FumadocsGraphView = dynamic<{ graph: Graph; 'aria-label'?: string }>(
  async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mod = await import('fumadocs-ui/components/graph-view' as string);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      return mod.GraphView;
    } catch {
      // Return a fallback component if import fails
      return function FallbackGraphView() {
        return (
          <div className="w-full h-[600px] rounded-lg border bg-muted flex items-center justify-center" role="status" aria-label="Graph view not available">
            <p className="text-muted-foreground">Graph view not available</p>
          </div>
        );
      };
    }
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] rounded-lg border bg-muted animate-pulse flex items-center justify-center" role="status" aria-label="Loading graph">
        <p className="text-muted-foreground">Loading graph...</p>
      </div>
    ),
  }
);

/**
 * Graph View component wrapper for Fumadocs.
 * 
 * Displays a visual graph of all documentation pages showing their relationships.
 * Particularly useful for visualizing connections between test files and example files.
 * 
 * This component is lazy-loaded for better performance and includes proper
 * accessibility attributes for screen readers and keyboard navigation.
 * 
 * @example
 * ```tsx
 * import { GraphView } from '@/components/graph-view';
 * 
 * export default function Page() {
 *   return <GraphView />;
 * }
 * ```
 */
export function GraphView() {
  const graph = buildGraph();
  
  return (
    <div 
      className="w-full h-[600px] rounded-lg border bg-background" 
      role="region" 
      aria-label="Documentation page relationship graph"
      tabIndex={0}
    >
      <FumadocsGraphView 
        graph={graph}
        aria-label="Documentation page relationship graph"
      />
    </div>
  );
}
