import { defineConfig } from 'tsup';

export default defineConfig([
  // CJS build
  {
    entry: ['src/index.ts', 'src/jest-adapter.ts', 'src/vitest-adapter.ts'],
    format: ['cjs'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    external: ['next-safe-action', 'zod'],
    tsconfig: './tsconfig.json',
    outExtension() {
      return { js: '.js' };
    },
  },
  // ESM build
  {
    entry: ['src/index.ts', 'src/jest-adapter.ts', 'src/vitest-adapter.ts'],
    format: ['esm'],
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

