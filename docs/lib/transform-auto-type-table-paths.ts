import { join, relative, dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Remark plugin that transforms auto-type-table paths from project-root-relative
 * (e.g., "src/client.ts") to MDX-file-relative paths (e.g., "../../../../src/client.ts")
 * before remarkAutoTypeTable processes them.
 *
 * This allows us to use project-root-relative paths in MDX files while satisfying
 * remarkAutoTypeTable's requirement for MDX-file-relative paths.
 */
export function transformAutoTypeTablePaths() {
  return (tree: any, file: any) => {
    if (!file?.path) {
      return;
    }

    // Get project root (one level up from docs/)
    const projectRoot = resolve(process.cwd(), '..');
    const mdxDir = dirname(file.path);

    // Recursively visit all nodes in the tree
    function visit(node: any): void {
      if (node?.type === 'mdxJsxFlowElement' && node?.name === 'auto-type-table') {
        const pathAttr = node.attributes?.find(
          (attr: any) => attr?.type === 'mdxJsxAttribute' && attr?.name === 'path'
        );
        const nameAttr = node.attributes?.find(
          (attr: any) => attr?.type === 'mdxJsxAttribute' && attr?.name === 'name'
        );

        if (
          pathAttr &&
          pathAttr.type === 'mdxJsxAttribute' &&
          typeof pathAttr.value === 'string' &&
          !pathAttr.value.startsWith('.') &&
          !pathAttr.value.startsWith('/')
        ) {
          // Path is project-root-relative (e.g., "src/client.ts")
          // Transform it to MDX-file-relative
          const absolutePath = join(projectRoot, pathAttr.value);
          const relativePath = relative(mdxDir, absolutePath);
          const originalPath = pathAttr.value;
          pathAttr.value = relativePath;
          
          // #region agent log
          if (typeof fetch !== 'undefined') {
            fetch('http://127.0.0.1:7943/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'transform-auto-type-table-paths.ts:40',message:'Transformed auto-type-table path',data:{originalPath,transformedPath:relativePath,mdxDir,projectRoot,absolutePath,absolutePathExists:existsSync(absolutePath),name:nameAttr?.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
          }
          // #endregion
        }
      }

      // Recursively visit children
      if (node?.children) {
        for (const child of node.children) {
          visit(child);
        }
      }
    }

    visit(tree);
  };
}
