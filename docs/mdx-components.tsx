import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import {
  createGenerator,
  createFileSystemGeneratorCache,
} from 'fumadocs-typescript';
import { AutoTypeTable } from 'fumadocs-typescript/ui';
import { createAPIPage } from 'fumadocs-openapi/ui';
import { openapi } from '@/lib/openapi';
import clientConfig from '@/components/api-page.client';
import { Steps, Step } from 'fumadocs-ui/components/steps';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { File, Folder, Files } from 'fumadocs-ui/components/files';
import { Button } from '@/components/button';
import { Badge } from '@/components/badge';
import { CodePlayground } from '@/components/code-playground';
import type { ComponentProps, ReactElement } from 'react';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

// Get project root (one level up from docs/)
const projectRoot = resolve(process.cwd(), '..');

// Create generator for AutoTypeTable
// Following Fumadocs docs exactly: https://fumadocs.dev/docs/ui/components/auto-type-table
// Note: AutoTypeTable resolves paths relative to cwd, so we don't set basePath
// The tsconfigPath should point to the project root tsconfig for proper compilation
const generator = createGenerator({
  // set a cache, necessary for serverless platform like Vercel
  cache: createFileSystemGeneratorCache('.next/fumadocs-typescript'),
  // Use project root tsconfig for TypeScript compilation
  tsconfigPath: join(projectRoot, 'tsconfig.json'),
});

// Create APIPage component from openapi server with client config
type APIPageComponent = ReturnType<typeof createAPIPage>;
let APIPage: APIPageComponent;
try {
  APIPage = createAPIPage(openapi, {
    client: clientConfig,
  });
} catch (error) {
  // Fallback if OpenAPI fails to load
  console.warn('Failed to create APIPage:', error);
  APIPage = (() => <div>OpenAPI documentation is temporarily unavailable.</div>) as APIPageComponent;
}

// Type-safe wrapper for APIPage
type APIPageProps = ComponentProps<APIPageComponent>;
function SafeAPIPage(props: APIPageProps): ReactElement {
  return <APIPage {...props} />;
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  // #region agent log
  const defaultKeys = Object.keys(defaultMdxComponents || {});
  const defaultMdxComponentsAny = defaultMdxComponents as any;
  fetch('http://127.0.0.1:7943/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mdx-components.tsx:55',message:'getMDXComponents called',data:{defaultKeysCount:defaultKeys.length,hasAutoTypeTable:!!defaultMdxComponentsAny?.AutoTypeTable,hasAutoTypeTableKebab:!!defaultMdxComponentsAny?.['auto-type-table']},timestamp:Date.now(),sessionId:'debug-session',runId:'run10',hypothesisId:'L'})}).catch(()=>{});
  // #endregion
  
  const result = {
    ...defaultMdxComponents,
    // Following Fumadocs docs exactly: https://fumadocs.dev/docs/ui/components/auto-type-table
    // Note: AutoTypeTable resolves paths relative to cwd, not basePath
    // So we need to transform project-root-relative paths to cwd-relative paths
    AutoTypeTable: (props: any) => {
      // #region agent log
      // Transform path from project-root-relative to cwd-relative if needed
      let transformedPath = props?.path;
      if (transformedPath && typeof transformedPath === 'string' && !transformedPath.startsWith('.') && !transformedPath.startsWith('/')) {
        // Path is project-root-relative (e.g., "src/client.ts")
        // Transform to cwd-relative (e.g., "../src/client.ts")
        transformedPath = join('..', transformedPath);
      }
      const resolvedPath = transformedPath ? resolve(process.cwd(), transformedPath) : undefined;
      const pathExists = resolvedPath ? existsSync(resolvedPath) : false;
      // Also check if path relative to basePath exists (for generator context)
      const basePathResolved = props?.path ? resolve(projectRoot, props.path) : undefined;
      const basePathExists = basePathResolved ? existsSync(basePathResolved) : false;
      fetch('http://127.0.0.1:7943/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mdx-components.tsx:68',message:'AutoTypeTable called (camelCase)',data:{originalPath:props?.path,transformedPath,resolvedPath,pathExists,basePathResolved,basePathExists,cwd:process.cwd(),basePath:projectRoot,hasName:!!props?.name,nameValue:props?.name,hasType:!!props?.type,typeValue:props?.type?String(props.type).substring(0,100):'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'P'})}).catch(()=>{});
      // #endregion
      
      // Validate required props
      if (!props?.path && !props?.type) {
        // #region agent log
        fetch('http://127.0.0.1:7943/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mdx-components.tsx:77',message:'AutoTypeTable missing path and type',data:{propsKeys:Object.keys(props||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'P'})}).catch(()=>{});
        // #endregion
        if (process.env.NODE_ENV === 'development') {
          console.warn('AutoTypeTable: missing both path and type props', props);
        }
        return <></>;
      }
      
      if (props?.path && !pathExists && !basePathExists) {
        // #region agent log
        fetch('http://127.0.0.1:7943/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mdx-components.tsx:84',message:'AutoTypeTable path does not exist',data:{originalPath:props?.path,transformedPath,resolvedPath,basePathResolved},timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'P'})}).catch(()=>{});
        // #endregion
        if (process.env.NODE_ENV === 'development') {
          console.warn('AutoTypeTable: path does not exist', { originalPath: props?.path, transformedPath, resolvedPath, basePathResolved });
        }
        return <div style={{padding:'1rem',background:'#fee',border:'1px solid #fcc'}}>Type table: file not found ({props?.path})</div>;
      }
      
      try {
        // Use transformed path (relative to cwd) for AutoTypeTable
        // The generator's basePath is used for TypeScript compilation context
        const component = <AutoTypeTable {...props} path={transformedPath} generator={generator} />;
        // #region agent log
        fetch('http://127.0.0.1:7943/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mdx-components.tsx:95',message:'AutoTypeTable rendered (camelCase)',data:{isElement:component?.type!==undefined,componentType:typeof component},timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'P'})}).catch(()=>{});
        // #endregion
        return component;
      } catch (error) {
        // #region agent log
        const errorDetails = {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorName: error instanceof Error ? error.name : typeof error,
          path: props?.path,
          name: props?.name,
          type: props?.type ? String(props.type).substring(0, 100) : undefined,
        };
        fetch('http://127.0.0.1:7943/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mdx-components.tsx:102',message:'AutoTypeTable error (camelCase)',data:errorDetails,timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'P'})}).catch(()=>{});
        // #endregion
        
        // Check for the specific "dereferenced" error
        const isDereferenceError = error instanceof Error && (
          error.message.includes('dereferenced') ||
          error.message.includes('Cannot destructure property') ||
          error.stack?.includes('dereferenced')
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.error('AutoTypeTable error:', error);
          if (isDereferenceError) {
            console.error('This error typically occurs when the type cannot be resolved or processed by the TypeScript compiler. Check that:', {
              path: props?.path,
              name: props?.name,
              'file exists': pathExists || basePathExists,
              'type exported': props?.name ? 'Check if type is exported from file' : 'N/A',
            });
          }
        }
        
        // Return a more helpful error message
        if (isDereferenceError) {
          return <div style={{padding:'1rem',background:'#fee',border:'1px solid #fcc'}}>
            <strong>Type table error:</strong> Could not process type &quot;{props?.name || 'unknown'}&quot; from {props?.path || 'unknown file'}. 
            {props?.name && <div style={{marginTop:'0.5rem',fontSize:'0.875rem'}}>Ensure the type is exported and can be resolved by TypeScript.</div>}
          </div>;
        }
        
        return <div style={{padding:'1rem',background:'#fee',border:'1px solid #fcc'}}>Error rendering type table: {error instanceof Error ? error.message : String(error)}</div>;
      }
    },
    // Also support kebab-case for MDX (maps to same component)
    'auto-type-table': (props: any) => {
      // #region agent log
      fetch('http://127.0.0.1:7943/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mdx-components.tsx:82',message:'auto-type-table called (kebab-case)',data:{hasPath:!!props?.path,hasName:!!props?.name,pathValue:props?.path?String(props.path):'undefined',nameValue:props?.name?String(props.name):'undefined',propsKeys:Object.keys(props||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run10',hypothesisId:'L'})}).catch(()=>{});
      // #endregion
      try {
        const component = <AutoTypeTable {...props} generator={generator} />;
        // #region agent log
        fetch('http://127.0.0.1:7943/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mdx-components.tsx:87',message:'auto-type-table rendered (kebab-case)',data:{isElement:component?.type!==undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run10',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
        return component;
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7943/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mdx-components.tsx:92',message:'auto-type-table error (kebab-case)',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run10',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
        if (process.env.NODE_ENV === 'development') {
          console.error('auto-type-table error:', error);
        }
        return <></>;
      }
    },
    // Add APIPage component for OpenAPI documentation
    APIPage: SafeAPIPage,
    // Also support OpenAPI as an alias
    OpenAPI: SafeAPIPage,
    // Add Steps component for step-by-step guides
    Steps: Steps,
    Step: Step,
    // Add Accordion for expandable content
    Accordion: Accordion,
    Accordions: Accordions,
    // Add Badge for status indicators
    Badge: Badge,
    // Add Button for CTAs
    Button: Button,
    // Add Tabs for content organization (non-code)
    Tabs: Tabs,
    Tab: Tab,
    // Add DynamicCodeBlock for client-side code highlighting
    DynamicCodeBlock: DynamicCodeBlock,
    // Add CodePlayground for interactive code examples
    CodePlayground: CodePlayground,
    // Add Files component for displaying file structure
    File: File,
    Folder: Folder,
    Files: Files,
    ...components,
  };
  
  // #region agent log
  const resultKeys = Object.keys(result);
  fetch('http://127.0.0.1:7943/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mdx-components.tsx:100',message:'getMDXComponents returning',data:{resultKeysCount:resultKeys.length,hasAutoTypeTable:!!result.AutoTypeTable,hasAutoTypeTableKebab:!!result['auto-type-table'],autoTypeTableType:typeof result.AutoTypeTable},timestamp:Date.now(),sessionId:'debug-session',runId:'run10',hypothesisId:'L'})}).catch(()=>{});
  // #endregion
  
  return result;
}
