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
 * Creates a new blog post with comprehensive validation. This action requires
 * authentication and validates both input and output schemas.
 *
 * @param input - The input object containing post data
 * @param input.title - Post title (required, 1-200 characters)
 * @param input.content - Post content (required, minimum 50 characters)
 * @param input.slug - URL-friendly slug (required, lowercase alphanumeric with hyphens)
 * @param input.published - Whether the post is published (optional, defaults to false)
 * @param input.tags - Array of tag strings (optional)
 * @returns A SafeActionResult containing the created post data or validation/error information
 * @returns Returns data with: id, title, content, slug, published, authorId, createdAt, tags
 * @throws {Error} Throws error if user is not authenticated (handled by authedAction middleware)
 * @throws {Error} Throws error if database operation fails
 *
 * @remarks
 * This is a real production action that works in both test and production environments.
 * In tests, safemocker automatically mocks next-safe-action, allowing this exact code
 * to be tested without modifications. The action uses authedAction which automatically
 * injects authentication context (userId, userEmail, authToken) into the handler.
 *
 * @example
 * ```typescript
 * import { createPost } from './actions';
 * import type { InferSafeActionFnResult } from 'next-safe-action';
 *
 * // Type-safe result
 * type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
 *
 * // Call the action
 * const result = await createPost({
 *   title: 'My First Post',
 *   content: 'This is the content of my first post. It has enough characters to pass validation.',
 *   slug: 'my-first-post',
 *   published: true,
 *   tags: ['typescript', 'nextjs'],
 * });
 *
 * // Handle result
 * if (result.data) {
 *   console.log('Post created:', result.data.id);
 * } else if (result.fieldErrors) {
 *   console.error('Validation errors:', result.fieldErrors);
 * } else if (result.serverError) {
 *   console.error('Server error:', result.serverError);
 * }
 * ```
 *
 * @category Actions
 * @since 0.2.0
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
 * Get a post by ID (optional authentication)
 *
 * Retrieves a post by its ID. Authentication is optional - public posts can be
 * viewed without authentication, while private posts require authentication.
 * The response includes additional fields (isAuthor, viewerId) when the user
 * is authenticated.
 *
 * @param input - The input object containing the post ID
 * @param input.postId - UUID of the post to retrieve (required, must be valid UUID)
 * @returns A SafeActionResult containing the post data or validation/error information
 * @returns Returns data with: id, title, content, slug, published, authorId, isAuthor, viewerId (optional), createdAt
 * @throws {Error} Throws error if post is not found
 * @throws {Error} Throws error if database operation fails
 *
 * @remarks
 * This action demonstrates optional authentication. The optionalAuthAction middleware
 * allows the action to work with or without authentication. When authenticated, the
 * response includes viewer-specific information (isAuthor, viewerId). When not
 * authenticated, these fields are undefined/null.
 *
 * @example
 * ```typescript
 * import { getPost } from './actions';
 * import type { InferSafeActionFnResult } from 'next-safe-action';
 *
 * // Type-safe result
 * type GetPostResult = InferSafeActionFnResult<typeof getPost>;
 *
 * // Call the action (works with or without authentication)
 * const result = await getPost({
 *   postId: '123e4567-e89b-12d3-a456-426614174000',
 * });
 *
 * // Handle result
 * if (result.data) {
 *   console.log('Post:', result.data.title);
 *   if (result.data.isAuthor) {
 *     console.log('You are the author');
 *   }
 * } else if (result.fieldErrors) {
 *   console.error('Validation errors:', result.fieldErrors);
 * } else if (result.serverError) {
 *   console.error('Server error:', result.serverError);
 * }
 * ```
 *
 * @category Actions
 * @since 0.2.0
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
 * Updates an existing post. This action requires both authentication (user must
 * be logged in) and authorization (user must own the post). Only the post owner
 * can update their posts.
 *
 * @param input - The input object containing update data
 * @param input.postId - UUID of the post to update (required, must be valid UUID)
 * @param input.title - New post title (optional, 1-200 characters if provided)
 * @param input.content - New post content (optional, minimum 50 characters if provided)
 * @param input.published - New publication status (optional)
 * @returns A SafeActionResult containing the updated post data or validation/error information
 * @returns Returns data with: id, title, content, published, updatedAt
 * @throws {Error} Throws "Unauthorized" error if user is not the post owner
 * @throws {Error} Throws error if user is not authenticated (handled by authedAction middleware)
 * @throws {Error} Throws error if post is not found
 * @throws {Error} Throws error if database operation fails
 *
 * @remarks
 * This action demonstrates both authentication and authorization. The authedAction
 * middleware ensures the user is authenticated, and the handler performs an
 * authorization check to verify the user owns the post. If authorization fails,
 * the action throws an error which is caught and returned as serverError.
 *
 * @example
 * ```typescript
 * import { updatePost } from './actions';
 * import type { InferSafeActionFnResult } from 'next-safe-action';
 *
 * // Type-safe result
 * type UpdatePostResult = InferSafeActionFnResult<typeof updatePost>;
 *
 * // Call the action
 * const result = await updatePost({
 *   postId: '123e4567-e89b-12d3-a456-426614174000',
 *   title: 'Updated Title',
 *   content: 'This is the updated content with enough characters to pass validation.',
 *   published: true,
 * });
 *
 * // Handle result
 * if (result.data) {
 *   console.log('Post updated:', result.data.updatedAt);
 * } else if (result.serverError) {
 *   if (result.serverError.includes('Unauthorized')) {
 *     console.error('You can only update your own posts');
 *   } else {
 *     console.error('Server error:', result.serverError);
 *   }
 * } else if (result.fieldErrors) {
 *   console.error('Validation errors:', result.fieldErrors);
 * }
 * ```
 *
 * @category Actions
 * @since 0.2.0
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
 *
 * Permanently deletes a post. This action requires both authentication (user must
 * be logged in) and authorization (user must own the post). Only the post owner
 * can delete their posts.
 *
 * @param input - The input object containing the post ID
 * @param input.postId - UUID of the post to delete (required, must be valid UUID)
 * @returns A SafeActionResult containing deletion confirmation or validation/error information
 * @returns Returns data with: deleted (boolean), postId, deletedAt (ISO timestamp)
 * @throws {Error} Throws "Unauthorized" error if user is not the post owner
 * @throws {Error} Throws error if user is not authenticated (handled by authedAction middleware)
 * @throws {Error} Throws error if post is not found
 * @throws {Error} Throws error if database operation fails
 *
 * @remarks
 * This action performs a permanent deletion. The action verifies both authentication
 * (via authedAction middleware) and authorization (via handler check). If
 * authorization fails, the action throws an error which is caught and returned
 * as serverError.
 *
 * @example
 * ```typescript
 * import { deletePost } from './actions';
 * import type { InferSafeActionFnResult } from 'next-safe-action';
 *
 * // Type-safe result
 * type DeletePostResult = InferSafeActionFnResult<typeof deletePost>;
 *
 * // Call the action
 * const result = await deletePost({
 *   postId: '123e4567-e89b-12d3-a456-426614174000',
 * });
 *
 * // Handle result
 * if (result.data) {
 *   console.log('Post deleted:', result.data.postId);
 *   console.log('Deleted at:', result.data.deletedAt);
 * } else if (result.serverError) {
 *   if (result.serverError.includes('Unauthorized')) {
 *     console.error('You can only delete your own posts');
 *   } else {
 *     console.error('Server error:', result.serverError);
 *   }
 * } else if (result.fieldErrors) {
 *   console.error('Validation errors:', result.fieldErrors);
 * }
 * ```
 *
 * @category Actions
 * @since 0.2.0
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
 * Searches for posts matching a query string. This action is rate-limited to
 * prevent abuse and supports optional authentication. Rate limiting is handled
 * automatically by the rateLimitedAction middleware.
 *
 * @param input - The input object containing search parameters
 * @param input.query - Search query string (required, 1-100 characters)
 * @param input.limit - Maximum number of results to return (optional, 1-50, defaults to 10)
 * @returns A SafeActionResult containing search results or validation/error information
 * @returns Returns data with: results (array of posts with id, title, slug, published), total (number)
 * @throws {Error} Throws error if rate limit is exceeded (handled by rateLimitedAction middleware)
 * @throws {Error} Throws error if database operation fails
 *
 * @remarks
 * This action demonstrates rate limiting with optional authentication. The
 * rateLimitedAction middleware automatically enforces rate limits based on the
 * action metadata. Authentication is optional, allowing both authenticated and
 * unauthenticated users to search posts, though rate limits may differ.
 *
 * @example
 * ```typescript
 * import { searchPosts } from './actions';
 * import type { InferSafeActionFnResult } from 'next-safe-action';
 *
 * // Type-safe result
 * type SearchPostsResult = InferSafeActionFnResult<typeof searchPosts>;
 *
 * // Call the action (works with or without authentication)
 * const result = await searchPosts({
 *   query: 'typescript',
 *   limit: 20,
 * });
 *
 * // Handle result
 * if (result.data) {
 *   console.log(`Found ${result.data.total} posts`);
 *   result.data.results.forEach((post) => {
 *     console.log(`- ${post.title} (${post.slug})`);
 *   });
 * } else if (result.fieldErrors) {
 *   console.error('Validation errors:', result.fieldErrors);
 * } else if (result.serverError) {
 *   if (result.serverError.includes('rate limit')) {
 *     console.error('Rate limit exceeded. Please try again later.');
 *   } else {
 *     console.error('Server error:', result.serverError);
 *   }
 * }
 * ```
 *
 * @category Actions
 * @since 0.2.0
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

