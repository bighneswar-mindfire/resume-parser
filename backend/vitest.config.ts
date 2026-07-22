import { defineConfig, type Plugin } from 'vitest/config';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * The backend source uses NodeNext-style specifiers like
 *   import { Resume } from '../models/Resume.js';
 * Vitest/Vite resolves imports against the file system directly, so we need
 * to rewrite those `.js` specifiers to `.ts` for local files that don't have
 * a compiled `.js` sibling.
 */
function jsToTsResolver(): Plugin {
  return {
    name: 'resolve-js-to-ts',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!importer) return null;
      if (!source.startsWith('.') || !source.endsWith('.js')) return null;

      const absolute = resolve(dirname(importer), source);
      const tsCandidate = absolute.replace(/\.js$/, '.ts');
      if (existsSync(tsCandidate)) return tsCandidate;
      return null;
    },
  };
}

export default defineConfig({
  plugins: [jsToTsResolver()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/test/**',
        'src/index.ts',
        'src/worker.ts',
        'src/testParser.ts',
        'src/workers/**',
        'src/queues/**',
        'src/config/**',
      ],
    },
  },
});
