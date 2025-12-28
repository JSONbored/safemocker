/**
 * Tests for authentication.example.ts
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
import { createPost, getPublicPost } from './authentication.example';
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('authentication.example', () => {
  describe('createPost', () => {
    it('should create post with authentication context', async () => {
      const result = await createPost({
        title: 'My First Post',
        content: 'This is the content of my first post.',
      });

      type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
      const typedResult: CreatePostResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.authorId).toBe('authenticated-user-id');
      expect(typedResult.data?.authorEmail).toBe('authenticated@example.com');
      expect(typedResult.fieldErrors).toBeUndefined();
    });
  });

  describe('getPublicPost', () => {
    it('should get public post with optional authentication', async () => {
      const result = await getPublicPost({ postId: 'post-123' });

      type GetPublicPostResult = InferSafeActionFnResult<typeof getPublicPost>;
      const typedResult: GetPublicPostResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.isViewer).toBe(true);
      expect(typedResult.data?.viewerId).toBe('optional-user-id');
    });
  });
});

