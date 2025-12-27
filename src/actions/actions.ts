/**
 * Example Production Actions
 *
 * These are REAL production actions that would be used in a Next.js application.
 * They use the real safe-action.ts file and work in both test and production.
 *
 * In tests, safemocker automatically mocks next-safe-action via __mocks__/next-safe-action.ts,
 * allowing these exact same production actions to be tested without any modifications.
 *
 * This demonstrates true integration testing - test your real production code!
 */

import { z } from 'zod';
import { authedAction, optionalAuthAction, rateLimitedAction } from './safe-action';

/**
 * Create a new post (requires authentication)
 * 
 * Real production action that would:
 * - Validate user is authenticated
 * - Validate input schema
 * - Create post in database
 * - Return created post
 */
export const createPost = authedAction
  .inputSchema(
    z.object({
      title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
      content: z.string().min(50, 'Content must be at least 50 characters'),
      slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
      published: z.boolean().optional(),
      tags: z.array(z.string().min(1)).optional(),
    })
  )
  .outputSchema(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      slug: z.string(),
      published: z.boolean(),
      authorId: z.string(),
      createdAt: z.string(),
      tags: z.array(z.string()),
    })
  )
  .metadata({ actionName: 'createPost', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    // In production, this would:
    // 1. Create post in database using Prisma/your ORM
    // 2. Handle errors properly
    // 3. Return the created post
    
    // For this example, we simulate database creation
    const post = {
      id: `post-${Date.now()}`,
      title: parsedInput.title,
      content: parsedInput.content,
      slug: parsedInput.slug,
      published: parsedInput.published ?? false,
      authorId: ctx.userId, // From auth middleware
      createdAt: new Date().toISOString(),
      tags: parsedInput.tags || [],
    };

    return post;
  });

/**
 * Get a post (optional authentication - public posts don't require auth)
 * 
 * Demonstrates optional authentication - the post might be public or private.
 */
export const getPost = optionalAuthAction
  .inputSchema(
    z.object({
      postId: z.string().uuid('Invalid post ID'),
    })
  )
  .outputSchema(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      slug: z.string(),
      published: z.boolean(),
      authorId: z.string(),
      isAuthor: z.boolean(),
      viewerId: z.string().optional(),
      createdAt: z.string(),
    })
  )
  .metadata({ actionName: 'getPost', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    // In production, this would:
    // 1. Fetch post from database
    // 2. Check if user is authenticated
    // 3. Return different data based on auth status
    
    // For this example, we simulate database fetch
    const post = {
      id: parsedInput.postId,
      title: 'Example Post',
      content: 'This is the post content. It demonstrates how optional authentication works.',
      slug: 'example-post',
      published: true,
      authorId: 'author-123',
      isAuthor: ctx.userId === 'author-123', // Check if viewer is author
      viewerId: ctx.userId, // Optional - undefined if not authenticated
      createdAt: new Date().toISOString(),
    };

    return post;
  });

/**
 * Update a post (requires authentication + authorization)
 * 
 * Demonstrates an action that requires:
 * - Authentication (user must be logged in)
 * - Authorization (user must own the post)
 */
export const updatePost = authedAction
  .inputSchema(
    z.object({
      postId: z.string().uuid('Invalid post ID'),
      title: z.string().min(1).max(200).optional(),
      content: z.string().min(50).optional(),
      published: z.boolean().optional(),
    })
  )
  .outputSchema(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      published: z.boolean(),
      updatedAt: z.string(),
    })
  )
  .metadata({ actionName: 'updatePost', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    // In production, this would:
    // 1. Fetch post from database
    // 2. Verify user owns the post (authorization check)
    // 3. Update the post
    // 4. Return updated post
    
    // For this example, we simulate authorization check
    const postAuthorId = 'author-123';
    if (ctx.userId !== postAuthorId) {
      throw new Error('Unauthorized: You can only update your own posts');
    }

    // Simulate database update
    const updatedPost = {
      id: parsedInput.postId,
      title: parsedInput.title || 'Updated Title',
      content: parsedInput.content || 'Updated content with enough characters to pass validation requirements.',
      published: parsedInput.published ?? true,
      updatedAt: new Date().toISOString(),
    };

    return updatedPost;
  });

/**
 * Delete a post (requires authentication + authorization)
 */
export const deletePost = authedAction
  .inputSchema(
    z.object({
      postId: z.string().uuid('Invalid post ID'),
    })
  )
  .outputSchema(
    z.object({
      deleted: z.boolean(),
      postId: z.string(),
      deletedAt: z.string(),
    })
  )
  .metadata({ actionName: 'deletePost', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    // In production, this would:
    // 1. Fetch post from database
    // 2. Verify user owns the post
    // 3. Delete the post
    // 4. Return confirmation
    
    // Simulate authorization check
    const postAuthorId = 'author-123';
    if (ctx.userId !== postAuthorId) {
      throw new Error('Unauthorized: You can only delete your own posts');
    }

    return {
      deleted: true,
      postId: parsedInput.postId,
      deletedAt: new Date().toISOString(),
    };
  });

/**
 * Search posts (rate limited, optional authentication)
 * 
 * Demonstrates rate-limited action with optional auth.
 */
export const searchPosts = rateLimitedAction
  .inputSchema(
    z.object({
      query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
      limit: z.number().int().min(1).max(50).optional(),
    })
  )
  .outputSchema(
    z.object({
      results: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          slug: z.string(),
          published: z.boolean(),
        })
      ),
      total: z.number(),
    })
  )
  .metadata({ actionName: 'searchPosts', category: 'content' })
  .action(async ({ parsedInput }) => {
    // In production, this would:
    // 1. Search posts in database
    // 2. Apply rate limiting (handled by rateLimitedAction middleware)
    // 3. Return search results
    
    // Simulate search
    return {
      results: [
        {
          id: 'post-1',
          title: 'Search Result 1',
          slug: 'search-result-1',
          published: true,
        },
        {
          id: 'post-2',
          title: 'Search Result 2',
          slug: 'search-result-2',
          published: true,
        },
      ],
      total: 2,
    };
  });

