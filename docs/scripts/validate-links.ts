#!/usr/bin/env tsx

/**
 * Link validation script for documentation using next-validate-link
 * 
 * Checks all internal and external links in MDX files to ensure they're valid.
 * This script should be run as part of the build process.
 */

import {
  type FileObject,
  printErrors,
  scanURLs,
  validateFiles,
} from 'next-validate-link';
import type { InferPageType } from 'fumadocs-core/source';
import { source } from '@/lib/source';

/**
 * Extract headings from a page for anchor link validation
 */
function getHeadings({ data }: InferPageType<typeof source>): string[] {
  return data.toc.map((item) => item.url.slice(1));
}

/**
 * Get all MDX files with their content for validation
 */
async function getFiles(): Promise<FileObject[]> {
  const promises = source.getPages().map(
    async (page): Promise<FileObject> => ({
      path: page.absolutePath || '',
      content: await page.data.getText('raw'),
      url: page.url,
      data: page.data,
    }),
  );

  return Promise.all(promises);
}

/**
 * Main validation function
 */
async function checkLinks() {
  const scanned = await scanURLs({
    // Use Next.js preset for Fumadocs MDX
    preset: 'next',
    populate: {
      'docs/[[...slug]]': source.getPages().map((page) => {
        return {
          value: {
            slug: page.slugs,
          },
          hashes: getHeadings(page),
        };
      }),
    },
  });

  const files = await getFiles();

  printErrors(
    await validateFiles(files, {
      scanned,
      // Check relative paths as URLs
      checkRelativePaths: 'as-url',
    }),
    true,
  );
}

void checkLinks();
