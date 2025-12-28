# safemocker Documentation

This directory contains the Fumadocs documentation site for `safemocker`.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Type check
pnpm type-check
```

## OpenAPI Documentation

The OpenAPI specification is generated from Zod schemas in the example actions.

```bash
# Generate OpenAPI spec
pnpm openapi:generate
```

This generates `openapi.json` which is used by `fumadocs-openapi` to display interactive API documentation.

## Structure

- `content/docs/` - MDX documentation pages
- `scripts/generate-openapi.ts` - OpenAPI generation script
- `openapi.json` - Generated OpenAPI 3.1 specification
- `lib/openapi.ts` - Fumadocs OpenAPI server instance

## Features

- ✅ **TypeScript API Documentation**: Auto-generated from JSDoc via `fumadocs-typescript`
- ✅ **OpenAPI Documentation**: Complete OpenAPI 3.1 spec generated from Zod schemas via `fumadocs-openapi`
- ✅ **Full-Text Search**: Powered by Orama with instant results
- ✅ **SEO Optimized**: Sitemap, robots.txt, meta tags, Open Graph
- ✅ **Beautiful UI**: Modern Fumadocs themes with dark mode support
- ✅ **Interactive API Explorer**: Try API endpoints directly in the docs
- ✅ **Production Examples**: Real production code examples with comprehensive schemas

## Documentation Structure

- **Getting Started**: Installation, quick start, schema best practices
- **API Reference**: Complete API docs with TypeScript type tables
- **OpenAPI**: Interactive API explorer for all example actions
- **Examples**: Real-world usage patterns from production code
- **Guides**: Testing, type safety, advanced usage, troubleshooting
