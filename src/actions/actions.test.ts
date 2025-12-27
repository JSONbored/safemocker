/**
 * Example Tests - Complete Test Suite
 *
 * This demonstrates how to test your production actions with 100% type safety.
 * 
 * Key Points:
 * - Uses REAL production code (no modifications needed)
 * - 100% type-safe with InferSafeActionFnResult
 * - No type assertions needed
 * - Tests all scenarios: success, validation errors, server errors
 */

import { describe, expect, it } from '@jest/globals';
import {
  createPost,
  getPost,
  updatePost,
  deletePost,
  searchPosts,
} from './actions';
// Import InferSafeActionFnResult from next-safe-action (which is the mock in tests)
// This gives us the correct type with fieldErrors from safemocker - 100% type-safe!
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('Production Actions', () => {
  describe('createPost - Authentication Required', () => {
    it('should create post successfully with valid input', async () => {
      const result = await createPost({
        title: 'My First Post',
        content: 'This is the content of my first post. It has enough characters to pass validation.',
        slug: 'my-first-post',
        published: true,
        tags: ['typescript', 'nextjs', 'testing'],
      });

      // Option 1: Direct usage (TypeScript infers types automatically)
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('My First Post');
      expect(result.data?.authorId).toBe('test-user-id'); // From safemocker auth context
      expect(result.data?.tags).toEqual(['typescript', 'nextjs', 'testing']);
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined(); // Type-safe access!

      // Option 2: Explicit typing (optional, for better IntelliSense)
      type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
      const typedResult: CreatePostResult = result;
      expect(typedResult.fieldErrors).toBeUndefined(); // Type-safe!
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

      // fieldErrors is accessible without type assertions - 100% type-safe!
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

      expect(result.data).toBeDefined();
      expect(result.data?.published).toBe(false); // Default value
      expect(result.data?.tags).toEqual([]); // Default empty array
    });
  });

  describe('getPost - Optional Authentication', () => {
    it('should return post with authenticated user', async () => {
      const result = await getPost({
        postId: '123e4567-e89b-12d3-a456-426614174000',
      });

      type GetPostResult = InferSafeActionFnResult<typeof getPost>;
      const typedResult: GetPostResult = result;

      expect(typedResult.data).toBeDefined();
      if (typedResult.data) {
        expect(typedResult.data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(typedResult.data.viewerId).toBe('test-user-id'); // From safemocker optional auth
        expect(typedResult.data.isAuthor).toBe(false);
      }
      expect(typedResult.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for invalid post ID', async () => {
      const result = await getPost({
        postId: 'invalid-uuid',
      });

      type GetPostResult = InferSafeActionFnResult<typeof getPost>;
      const typedResult: GetPostResult = result;

      // Type-safe access to fieldErrors
      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.postId).toBeDefined();
      expect(typedResult.data).toBeUndefined();
    });
  });

  describe('updatePost - Authentication + Authorization', () => {
    it('should fail authorization when user is not author', async () => {
      // Note: In this test, the mock auth context has userId: 'test-user-id'
      // But the post author is 'author-123', so this will fail authorization
      // This demonstrates real authorization logic being tested
      
      const result = await updatePost({
        postId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Updated Title',
        content: 'This is updated content with enough characters to pass validation requirements.',
      });

      type UpdatePostResult = InferSafeActionFnResult<typeof updatePost>;
      const typedResult: UpdatePostResult = result;

      // This should fail authorization check
      expect(typedResult.serverError).toBeDefined();
      expect(typedResult.serverError).toContain('Unauthorized');
      expect(typedResult.data).toBeUndefined();
    });

    it('should return validation errors for invalid input', async () => {
      const result = await updatePost({
        postId: 'invalid-uuid',
        title: '', // Invalid: min length
        content: 'short', // Invalid: min length
      });

      type UpdatePostResult = InferSafeActionFnResult<typeof updatePost>;
      const typedResult: UpdatePostResult = result;

      // Type-safe access to fieldErrors
      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.postId).toBeDefined();
      expect(typedResult.fieldErrors?.title).toBeDefined();
      expect(typedResult.fieldErrors?.content).toBeDefined();
      expect(typedResult.data).toBeUndefined();
    });
  });

  describe('deletePost - Authentication + Authorization', () => {
    it('should fail authorization when user is not author', async () => {
      const result = await deletePost({
        postId: '123e4567-e89b-12d3-a456-426614174000',
      });

      type DeletePostResult = InferSafeActionFnResult<typeof deletePost>;
      const typedResult: DeletePostResult = result;

      // Authorization check fails
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

      // Type-safe access to fieldErrors
      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.postId).toBeDefined();
      expect(typedResult.data).toBeUndefined();
    });
  });

  describe('searchPosts - Rate Limited Action', () => {
    it('should search posts successfully', async () => {
      const result = await searchPosts({
        query: 'typescript',
        limit: 10,
      });

      type SearchPostsResult = InferSafeActionFnResult<typeof searchPosts>;
      const typedResult: SearchPostsResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.results).toBeDefined();
      expect(Array.isArray(typedResult.data?.results)).toBe(true);
      expect(typedResult.data?.total).toBe(2);
      expect(typedResult.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for invalid input', async () => {
      const result = await searchPosts({
        query: '', // Invalid: min length
        limit: 100, // Invalid: max is 50
      });

      type SearchPostsResult = InferSafeActionFnResult<typeof searchPosts>;
      const typedResult: SearchPostsResult = result;

      // Type-safe access to fieldErrors
      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.query).toBeDefined();
      expect(typedResult.fieldErrors?.limit).toBeDefined();
      expect(typedResult.data).toBeUndefined();
    });
  });

  describe('Type Safety Verification', () => {
    it('should provide 100% type safety without type assertions', async () => {
      const result = await createPost({
        title: 'Type Safety Test',
        content: 'This demonstrates that InferSafeActionFnResult provides full type safety without any assertions.',
        slug: 'type-safety-test',
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

