/**
 * Production Example Test
 *
 * This test file demonstrates how safemocker works with REAL production code.
 * 
 * Key Points:
 * - We import REAL production actions from src/actions/actions.ts
 * - These actions use the REAL safe-action.ts file
 * - In tests, next-safe-action is automatically mocked by safemocker
 * - We use InferSafeActionFnResult for 100% type safety - NO type assertions needed
 * - This proves safemocker works with production code without any modifications
 */

import { describe, expect, it } from '@jest/globals';
import {
  createPost,
  getPost,
  updatePost,
  deletePost,
} from '../src/actions/actions';
// Import InferSafeActionFnResult from next-safe-action (which is the mock in tests)
// This gives us the correct type with fieldErrors from safemocker - 100% type-safe!
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('Production Example - Real Production Code Testing', () => {
  describe('createPost - Production Action', () => {
    it('should create post successfully with valid input', async () => {
      const result = await createPost({
        title: 'My First Blog Post',
        content: 'This is the content of my blog post. It has enough characters to pass validation.',
        slug: 'my-first-blog-post',
        published: true,
        tags: ['typescript', 'nextjs'],
      });

      // Use InferSafeActionFnResult for 100% type safety - NO type assertions needed!
      type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
      const typedResult: CreatePostResult = result;

      // All properties are type-safe, including fieldErrors
      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.title).toBe('My First Blog Post');
      expect(typedResult.data?.content).toBe('This is the content of my blog post. It has enough characters to pass validation.');
      expect(typedResult.data?.published).toBe(true);
      expect(typedResult.data?.authorId).toBe('test-user-id'); // From safemocker auth context
      expect(typedResult.data?.tags).toEqual(['typescript', 'nextjs']);
      expect(typedResult.serverError).toBeUndefined();
      expect(typedResult.fieldErrors).toBeUndefined(); // Type-safe access - no assertions needed!
    });

    it('should return validation errors for invalid input', async () => {
      const result = await createPost({
        title: '', // Invalid: min length
        content: 'short', // Invalid: min length
        slug: 'Invalid Slug!', // Invalid: regex pattern
        published: true,
      });

      type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
      const typedResult: CreatePostResult = result;

      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.title).toBeDefined();
      expect(typedResult.fieldErrors?.content).toBeDefined();
      expect(typedResult.fieldErrors?.slug).toBeDefined();
      expect(typedResult.data).toBeUndefined();
      expect(typedResult.serverError).toBeUndefined();
    });

    it('should handle optional fields correctly', async () => {
      const result = await createPost({
        title: 'Post Without Tags',
        content: 'This post does not have tags or published status specified, but has enough content.',
        slug: 'post-without-tags',
      });

      type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
      const typedResult: CreatePostResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.published).toBe(false); // Default value
      expect(typedResult.data?.tags).toEqual([]); // Default empty array
    });
  });

  describe('getPost - Optional Auth Action', () => {
    it('should return post with authenticated user', async () => {
      const result = await getPost({
        postId: '123e4567-e89b-12d3-a456-426614174000',
      });

      type GetPostResult = InferSafeActionFnResult<typeof getPost>;
      const typedResult: GetPostResult = result;

      expect(typedResult.data).toBeDefined();
      if (typedResult.data) {
        expect(typedResult.data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(typedResult.data.viewerId).toBe('test-user-id');
        expect(typedResult.data.isAuthor).toBe(false);
      }
      expect(typedResult.serverError).toBeUndefined();
      expect(typedResult.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for invalid post ID', async () => {
      const result = await getPost({
        postId: 'invalid-uuid',
      });

      type GetPostResult = InferSafeActionFnResult<typeof getPost>;
      const typedResult: GetPostResult = result;

      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.postId).toBeDefined();
      expect(typedResult.data).toBeUndefined();
    });
  });

  describe('updatePost - Auth + Authorization Action', () => {
    it('should fail authorization when user is not author', async () => {
      // Note: In this test, the mock auth context has userId: 'test-user-id'
      // But the post author is 'author-123', so this will fail authorization
      const result = await updatePost({
        postId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Updated Title',
        content: 'This is updated content with enough characters to pass validation requirements.',
      });

      type UpdatePostResult = InferSafeActionFnResult<typeof updatePost>;
      const typedResult: UpdatePostResult = result;

      expect(typedResult.serverError).toBeDefined();
      expect(typedResult.serverError).toContain('Unauthorized');
      expect(typedResult.data).toBeUndefined();
    });

    it('should return validation errors for invalid input', async () => {
      const result = await updatePost({
        postId: 'invalid-uuid',
        title: 'Updated Title',
        content: 'This is updated content with enough characters to pass validation requirements.',
      });

      type UpdatePostResult = InferSafeActionFnResult<typeof updatePost>;
      const typedResult: UpdatePostResult = result;

      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.postId).toBeDefined();
      expect(typedResult.data).toBeUndefined();
      expect(typedResult.serverError).toBeUndefined();
    });
  });

  describe('deletePost - Auth + Authorization Action', () => {
    it('should fail authorization when user is not author', async () => {
      const result = await deletePost({
        postId: '123e4567-e89b-12d3-a456-426614174000',
      });

      type DeletePostResult = InferSafeActionFnResult<typeof deletePost>;
      const typedResult: DeletePostResult = result;

      expect(typedResult.serverError).toBeDefined();
      expect(typedResult.serverError).toContain('Unauthorized');
      expect(typedResult.data).toBeUndefined();
    });

    it('should return validation errors for invalid post ID', async () => {
      const result = await deletePost({
        postId: 'not-a-uuid',
      });

      type DeletePostResult = InferSafeActionFnResult<typeof deletePost>;
      const typedResult: DeletePostResult = result;

      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.postId).toBeDefined();
      expect(typedResult.data).toBeUndefined();
      expect(typedResult.serverError).toBeUndefined();
    });
  });

  describe('Type Safety Demonstration', () => {
    it('should provide 100% type safety with InferSafeActionFnResult', async () => {
      const result = await createPost({
        title: 'Type Safety Test',
        content: 'This post demonstrates 100% type safety with safemocker.',
        slug: 'type-safe-post',
      });

      // Use InferSafeActionFnResult - NO type assertions needed!
      type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
      const typedResult: CreatePostResult = result;

      // All of these are type-safe without any assertions:
      // - typedResult.data (correctly typed as the output schema)
      // - typedResult.fieldErrors (accessible, correctly typed)
      // - typedResult.serverError (accessible, correctly typed)
      // - typedResult.validationErrors (accessible, correctly typed)

      expect(typedResult).toHaveProperty('data');
      expect(typedResult).toHaveProperty('fieldErrors');
      expect(typedResult).toHaveProperty('serverError');
      expect(typedResult).toHaveProperty('validationErrors');

      // TypeScript knows about all properties - no type assertions needed!
      if (typedResult.data) {
        // TypeScript knows data has: id, title, content, slug, published, authorId, createdAt, tags
        expect(typeof typedResult.data.id).toBe('string');
        expect(typeof typedResult.data.title).toBe('string');
        expect(Array.isArray(typedResult.data.tags)).toBe(true);
        expect(typeof typedResult.data.authorId).toBe('string');
      }

      if (typedResult.fieldErrors) {
        // TypeScript knows fieldErrors is Record<string, string[]>
        expect(typeof typedResult.fieldErrors).toBe('object');
      }
    });
  });
});
