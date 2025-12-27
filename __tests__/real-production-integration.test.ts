/**
 * Real Production Integration Test
 *
 * This test demonstrates TRUE integration testing with safemocker:
 * - Uses REAL production code from src/actions/
 * - Uses the ONE-LINE mock setup (export * from '@jsonbored/safemocker/jest/mock')
 * - Tests production actions without any modifications
 * - 100% type-safe with InferSafeActionFnResult
 * - Zero type assertions needed
 * - Zero configuration issues
 *
 * This proves that safemocker works perfectly with real production code,
 * allowing true integration testing with zero setup complexity.
 */

import { describe, expect, it } from '@jest/globals';
import {
  createPost,
  getPost,
  updatePost,
  deletePost,
  searchPosts,
} from '../src/actions/actions';
// Import InferSafeActionFnResult from next-safe-action (which is the mock in tests)
// This gives us the correct type with fieldErrors from safemocker - 100% type-safe!
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('Real Production Integration - One-Line Mock Setup', () => {
  describe('createPost - Production Action', () => {
    it('should create post successfully with valid input', async () => {
      const result = await createPost({
        title: 'My First Post',
        content: 'This is the content of my first post. It has enough characters to pass validation.',
        slug: 'my-first-post',
        published: true,
        tags: ['typescript', 'nextjs', 'testing'],
      });

      // Use InferSafeActionFnResult for 100% type safety - NO type assertions needed!
      type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
      const typedResult: CreatePostResult = result;

      // All properties are type-safe, including fieldErrors
      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.title).toBe('My First Post');
      expect(typedResult.data?.content).toBe('This is the content of my first post. It has enough characters to pass validation.');
      expect(typedResult.data?.slug).toBe('my-first-post');
      expect(typedResult.data?.published).toBe(true);
      expect(typedResult.data?.authorId).toBe('test-user-id'); // From safemocker auth context
      expect(typedResult.data?.tags).toEqual(['typescript', 'nextjs', 'testing']);
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
      expect(typedResult.data?.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(typedResult.data?.viewerId).toBe('test-user-id'); // From safemocker optional auth
      expect(typedResult.data?.isAuthor).toBe(false);
      expect(typedResult.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for invalid post ID', async () => {
      const result = await getPost({
        postId: 'invalid-uuid',
      });

      type GetPostResult = InferSafeActionFnResult<typeof getPost>;
      const typedResult: GetPostResult = result;

      // Type-safe access to fieldErrors - no assertions needed!
      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.postId).toBeDefined();
      expect(typedResult.data).toBeUndefined();
    });
  });

  describe('updatePost - Auth + Authorization Action', () => {
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
        title: 'Updated Title',
        content: 'This is updated content with enough characters to pass validation requirements.',
      });

      type UpdatePostResult = InferSafeActionFnResult<typeof updatePost>;
      const typedResult: UpdatePostResult = result;

      // Type-safe access to fieldErrors
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
      expect(typedResult.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for invalid post ID', async () => {
      const result = await deletePost({ postId: 'invalid-uuid' });

      type DeletePostResult = InferSafeActionFnResult<typeof deletePost>;
      const typedResult: DeletePostResult = result;

      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.postId).toBeDefined();
      expect(typedResult.data).toBeUndefined();
      expect(typedResult.serverError).toBeUndefined();
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

  describe('Type Safety Demonstration', () => {
    it('should provide 100% type safety with InferSafeActionFnResult', async () => {
      const result = await createPost({
        title: 'Type Safe Post',
        content: 'This post demonstrates 100% type safety with safemocker.',
        slug: 'type-safe-post',
      });

      // Use InferSafeActionFnResult - NO type assertions needed!
      type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
      const typedResult: CreatePostResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.id).toBeDefined();
      expect(typedResult.data?.title).toBe('Type Safe Post');
      expect(typedResult.fieldErrors).toBeUndefined(); // Type-safe access!
      expect(typedResult.serverError).toBeUndefined();
    });
  });
});
