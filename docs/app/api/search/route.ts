import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

/**
 * Enhanced search API route with improved configuration.
 * 
 * Features:
 * - Full-text search powered by Orama
 * - Language-specific tokenization
 * - Result highlighting
 */
export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
});
