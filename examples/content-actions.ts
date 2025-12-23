/**
 * Example content actions demonstrating complex next-safe-action v8 features
 *
 * These actions showcase:
 * - Complex nested validation (objects with arrays, discriminated unions)
 * - Partial updates (optional fields, partial schemas)
 * - Complex transformations
 * - Different middleware patterns
 * - Real-world content management scenarios
 */

import { z } from 'zod';
import { authedAction, optionalAuthAction, rateLimitedAction } from './safe-action';

/**
 * Content type discriminated union
 */
const contentBaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(5000, 'Description must be less than 5000 characters').optional(),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  published: z.boolean().default(false),
});

const articleSchema = contentBaseSchema.extend({
  type: z.literal('article'),
  content: z.string().min(1, 'Article content is required'),
  readingTime: z.number().int().positive().optional(),
  author: z.string().min(1, 'Author is required'),
});

const videoSchema = contentBaseSchema.extend({
  type: z.literal('video'),
  videoUrl: z.string().url('Invalid video URL'),
  duration: z.number().int().positive('Duration must be positive'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
});

const podcastSchema = contentBaseSchema.extend({
  type: z.literal('podcast'),
  audioUrl: z.string().url('Invalid audio URL'),
  duration: z.number().int().positive('Duration must be positive'),
  episodeNumber: z.number().int().positive('Episode number must be positive'),
  host: z.string().min(1, 'Host is required'),
});

/**
 * Discriminated union for content types
 */
const contentSchema = z.discriminatedUnion('type', [
  articleSchema,
  videoSchema,
  podcastSchema,
]);

/**
 * Create content action (requires authentication)
 * 
 * Demonstrates:
 * - Discriminated union validation
 * - Complex nested objects
 * - Arrays with validation
 * - Optional fields with defaults
 */
export const createContent = authedAction
  .inputSchema(
    z.object({
      content: contentSchema,
      category: z.enum(['tech', 'business', 'lifestyle', 'education']),
      featured: z.boolean().default(false),
    })
  )
  .metadata({ actionName: 'createContent', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    // Verify context is available
    if (!ctx.userId) {
      throw new Error('User ID not available');
    }

    // Simulate content creation with type-specific logic
    const contentId = `content-${Date.now()}`;
    
    let typeSpecificData: Record<string, any> = {};
    
    if (parsedInput.content.type === 'article') {
      typeSpecificData = {
        readingTime: parsedInput.content.readingTime || Math.ceil(parsedInput.content.content.length / 200),
      };
    } else if (parsedInput.content.type === 'video') {
      typeSpecificData = {
        thumbnailUrl: parsedInput.content.thumbnailUrl || `https://example.com/thumbnails/${contentId}.jpg`,
      };
    } else if (parsedInput.content.type === 'podcast') {
      typeSpecificData = {
        transcriptUrl: `https://example.com/transcripts/${contentId}.txt`,
      };
    }

    return {
      id: contentId,
      ...parsedInput.content,
      ...typeSpecificData,
      category: parsedInput.category,
      featured: parsedInput.featured,
      createdBy: ctx.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

/**
 * Update content action (partial updates)
 * 
 * Demonstrates:
 * - Partial schema validation (all fields optional)
 * - Selective field updates
 * - Type-safe partial updates
 */
export const updateContent = authedAction
  .inputSchema(
    z.object({
      contentId: z.string().uuid('Invalid content ID'),
      updates: z.object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(5000).optional(),
        tags: z.array(z.string().min(1).max(50)).max(10).optional(),
        published: z.boolean().optional(),
        // Type-specific optional fields
        content: z.string().min(1).optional(), // For articles
        videoUrl: z.string().url().optional(), // For videos
        audioUrl: z.string().url().optional(), // For podcasts
        duration: z.number().int().positive().optional(),
        readingTime: z.number().int().positive().optional(),
        episodeNumber: z.number().int().positive().optional(),
        host: z.string().min(1).optional(),
        thumbnailUrl: z.string().url().optional(),
      }),
    })
  )
  .metadata({ actionName: 'updateContent', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    if (!ctx.userId) {
      throw new Error('User ID not available');
    }

    // Simulate partial update
    return {
      id: parsedInput.contentId,
      updatedFields: Object.keys(parsedInput.updates),
      updatedBy: ctx.userId,
      updatedAt: new Date().toISOString(),
      // In real usage, would merge with existing content
      mergedData: {
        ...parsedInput.updates,
      },
    };
  });

/**
 * Batch update content action
 * 
 * Demonstrates:
 * - Array validation with complex items
 * - Batch operations
 * - Complex transformations
 */
export const batchUpdateContent = authedAction
  .inputSchema(
    z.object({
      updates: z.array(
        z.object({
          contentId: z.string().uuid('Invalid content ID'),
          updates: z.object({
            title: z.string().min(1).max(200).optional(),
            published: z.boolean().optional(),
            tags: z.array(z.string().min(1).max(50)).max(10).optional(),
          }),
        })
      ).min(1, 'At least one update required').max(50, 'Maximum 50 updates per batch'),
    })
  )
  .metadata({ actionName: 'batchUpdateContent', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    if (!ctx.userId) {
      throw new Error('User ID not available');
    }

    // Simulate batch update
    return {
      updated: parsedInput.updates.map((update) => ({
        contentId: update.contentId,
        updatedFields: Object.keys(update.updates),
        updatedBy: ctx.userId,
        updatedAt: new Date().toISOString(),
      })),
      totalUpdated: parsedInput.updates.length,
      updatedBy: ctx.userId,
    };
  });

/**
 * Search content action (optional authentication, rate limited)
 * 
 * Demonstrates:
 * - Optional authentication (different behavior for authenticated vs anonymous)
 * - Rate limiting middleware
 * - Complex query validation
 * - Pagination
 */
export const searchContent = rateLimitedAction
  .inputSchema(
    z.object({
      query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
      category: z.enum(['tech', 'business', 'lifestyle', 'education']).optional(),
      contentType: z.enum(['article', 'video', 'podcast']).optional(),
      tags: z.array(z.string()).max(5, 'Maximum 5 tags').optional(),
      published: z.boolean().optional(),
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().min(1).max(100).default(20),
      sortBy: z.enum(['relevance', 'date', 'popularity']).default('relevance'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
  )
  .metadata({ actionName: 'searchContent', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    // Simulate search results
    const mockResults = [
      {
        id: 'content-1',
        title: `Result for "${parsedInput.query}"`,
        type: parsedInput.contentType || 'article',
        category: parsedInput.category || 'tech',
        published: parsedInput.published ?? true,
        relevance: 0.95,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'content-2',
        title: `Another result for "${parsedInput.query}"`,
        type: parsedInput.contentType || 'video',
        category: parsedInput.category || 'tech',
        published: parsedInput.published ?? true,
        relevance: 0.87,
        createdAt: new Date().toISOString(),
      },
    ];

    // Filter by optional criteria
    let filteredResults = mockResults;
    
    if (parsedInput.category) {
      filteredResults = filteredResults.filter((r) => r.category === parsedInput.category);
    }
    
    if (parsedInput.contentType) {
      filteredResults = filteredResults.filter((r) => r.type === parsedInput.contentType);
    }

    // Pagination
    const startIndex = (parsedInput.page - 1) * parsedInput.limit;
    const endIndex = startIndex + parsedInput.limit;
    const paginatedResults = filteredResults.slice(startIndex, endIndex);

    return {
      results: paginatedResults,
      total: filteredResults.length,
      page: parsedInput.page,
      limit: parsedInput.limit,
      totalPages: Math.ceil(filteredResults.length / parsedInput.limit),
      // Include viewer context if authenticated
      viewerId: ctx.userId,
      isAuthenticated: !!ctx.userId,
    };
  });

/**
 * Get content with relations action
 * 
 * Demonstrates:
 * - Complex nested data structures
 * - Optional relations
 * - Type-safe nested objects
 */
export const getContentWithRelations = optionalAuthAction
  .inputSchema(
    z.object({
      contentId: z.string().uuid('Invalid content ID'),
      include: z.object({
        author: z.boolean().default(false),
        comments: z.boolean().default(false),
        relatedContent: z.boolean().default(false),
        analytics: z.boolean().default(false),
      }).optional(),
    })
  )
  .metadata({ actionName: 'getContentWithRelations', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    const include = parsedInput.include || {
      author: false,
      comments: false,
      relatedContent: false,
      analytics: false,
    };

    const baseContent = {
      id: parsedInput.contentId,
      title: 'Sample Content',
      type: 'article' as const,
      content: 'Sample article content...',
      published: true,
      createdAt: new Date().toISOString(),
    };

    const relations: Record<string, any> = {};

    if (include.author) {
      relations.author = {
        id: 'author-1',
        name: 'John Doe',
        email: 'john@example.com',
        bio: 'Content creator',
      };
    }

    if (include.comments) {
      relations.comments = [
        {
          id: 'comment-1',
          content: 'Great article!',
          author: 'user-1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'comment-2',
          content: 'Very informative.',
          author: 'user-2',
          createdAt: new Date().toISOString(),
        },
      ];
    }

    if (include.relatedContent) {
      relations.relatedContent = [
        {
          id: 'related-1',
          title: 'Related Article 1',
          type: 'article',
        },
        {
          id: 'related-2',
          title: 'Related Video 1',
          type: 'video',
        },
      ];
    }

    if (include.analytics && ctx.userId) {
      // Only show analytics to authenticated users
      relations.analytics = {
        views: 1234,
        likes: 56,
        shares: 12,
        comments: 8,
      };
    }

    return {
      ...baseContent,
      ...relations,
      viewerId: ctx.userId,
      isOwnContent: ctx.userId === 'content-owner-id', // In real usage, would check ownership
    };
  });

