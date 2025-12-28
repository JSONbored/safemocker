/**
 * Tests for rate-limiting.example.ts
 *
 * This example demonstrates testing with Jest. For Vitest, simply change the import:
 *
 * Jest:
 * ```typescript
 * import { describe, expect, it } from '@jest/globals';
 * ```
 *
 * Vitest:
 * ```typescript
 * import { describe, expect, it } from 'vitest';
 * ```
 *
 * All other code remains identical between Jest and Vitest.
 */

import { describe, expect, it } from '@jest/globals';
import { searchPosts, fetchData } from './rate-limiting.example';
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('rate-limiting.example', () => {
  describe('searchPosts', () => {
    it('should search posts successfully', async () => {
      const result = await searchPosts({
        query: 'typescript',
        limit: 20,
      });

      type SearchPostsResult = InferSafeActionFnResult<typeof searchPosts>;
      const typedResult: SearchPostsResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.results.length).toBe(2);
      expect(typedResult.data?.query).toBe('typescript');
      expect(typedResult.fieldErrors).toBeUndefined();
    });
  });

  describe('fetchData', () => {
    it('should fetch data successfully', async () => {
      const result = await fetchData({
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      });

      type FetchDataResult = InferSafeActionFnResult<typeof fetchData>;
      const typedResult: FetchDataResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.data.endpoint).toBe('https://api.example.com/data');
      expect(typedResult.data?.data.method).toBe('GET');
    });
  });
});

