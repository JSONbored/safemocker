import { defineConfig } from 'tsup';

export default defineConfig([
  // CJS build - MUST output CommonJS syntax (module.exports, require)
  {
    entry: ['src/index.ts', 'src/jest-adapter.ts', 'src/vitest-adapter.ts', 'src/jest-mock.ts', 'src/vitest-mock.ts'],
    format: 'cjs',
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    bundle: true, // Bundle dependencies to ensure proper CJS conversion
    external: ['next-safe-action', 'zod'],
    // Use separate tsconfig with CommonJS module setting
    tsconfig: './tsconfig.cjs.json',
    outExtension({ format }) {
      // Use .cjs extension for CommonJS to ensure Node.js treats it as CJS
      return { js: format === 'cjs' ? '.cjs' : '.js' };
    },
    // Force esbuild to output CommonJS
    esbuildOptions(options) {
      options.format = 'cjs';
      options.platform = 'node';
      options.target = 'node18';
    },
  },
  // ESM build - Output ESM syntax (export, import)
  {
    entry: ['src/index.ts', 'src/jest-adapter.ts', 'src/vitest-adapter.ts'],
    format: 'esm',
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    external: ['next-safe-action', 'zod'],
    tsconfig: './tsconfig.json',
    outExtension() {
      return { js: '.mjs' };
    },
  },
]);

