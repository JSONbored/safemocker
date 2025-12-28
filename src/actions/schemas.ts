/**
 * Zod schemas with OpenAPI metadata for documentation generation
 *
 * This file defines the same schemas used in actions.ts but with OpenAPI metadata
 * added for generating comprehensive API documentation. These schemas are used by
 * the OpenAPI generation script in docs/scripts/generate-openapi.ts.
 *
 * @internal
 * @category Schemas
 */

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

// Create Post Input Schema
export const CreatePostInputSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters')
      .openapi({
        description: 'The title of the post',
        example: 'My First Post',
      }),
    content: z
      .string()
      .min(50, 'Content must be at least 50 characters')
      .openapi({
        description: 'The content/body of the post',
        example: 'This is the content of my first post. It has enough characters to pass validation.',
      }),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
      .openapi({
        description: 'URL-friendly slug for the post',
        example: 'my-first-post',
      }),
    published: z
      .boolean()
      .optional()
      .openapi({
        description: 'Whether the post is published',
        example: true,
      }),
    tags: z
      .array(z.string().min(1))
      .optional()
      .openapi({
        description: 'Tags associated with the post',
        example: ['typescript', 'nextjs', 'testing'],
      }),
  })
  .openapi({
    title: 'CreatePostInput',
    description: 'Input schema for creating a new post',
  });

// Create Post Output Schema
export const CreatePostOutputSchema = z
  .object({
    id: z.string().openapi({
      description: 'Unique identifier for the post',
      example: 'post-1234567890',
    }),
    title: z.string().openapi({
      description: 'The title of the post',
      example: 'My First Post',
    }),
    content: z.string().openapi({
      description: 'The content of the post',
      example: 'This is the content of my first post.',
    }),
    slug: z.string().openapi({
      description: 'URL-friendly slug',
      example: 'my-first-post',
    }),
    published: z.boolean().openapi({
      description: 'Publication status',
      example: true,
    }),
    authorId: z.string().openapi({
      description: 'ID of the author',
      example: 'test-user-id',
    }),
    createdAt: z.string().openapi({
      description: 'ISO 8601 timestamp of creation',
      example: '2024-01-01T00:00:00.000Z',
    }),
    tags: z.array(z.string()).openapi({
      description: 'Tags associated with the post',
      example: ['typescript', 'nextjs'],
    }),
  })
  .openapi({
    title: 'CreatePostOutput',
    description: 'Output schema for a created post',
  });

// Get Post Input Schema
export const GetPostInputSchema = z
  .object({
    postId: z.string().uuid('Invalid post ID').openapi({
      description: 'UUID of the post to retrieve',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  })
  .openapi({
    title: 'GetPostInput',
    description: 'Input schema for retrieving a post by ID',
  });

// Get Post Output Schema
export const GetPostOutputSchema = z
  .object({
    id: z.string().openapi({
      description: 'Unique identifier for the post',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    title: z.string().openapi({
      description: 'The title of the post',
      example: 'Example Post',
    }),
    content: z.string().openapi({
      description: 'The content of the post',
      example: 'This is the post content.',
    }),
    slug: z.string().openapi({
      description: 'URL-friendly slug',
      example: 'example-post',
    }),
    published: z.boolean().openapi({
      description: 'Publication status',
      example: true,
    }),
    authorId: z.string().openapi({
      description: 'ID of the author',
      example: 'author-123',
    }),
    isAuthor: z.boolean().openapi({
      description: 'Whether the viewer is the author (only when authenticated)',
      example: false,
    }),
    viewerId: z.string().optional().openapi({
      description: 'ID of the viewer (only when authenticated)',
      example: 'user-123',
    }),
    createdAt: z.string().openapi({
      description: 'ISO 8601 timestamp of creation',
      example: '2024-01-01T00:00:00.000Z',
    }),
  })
  .openapi({
    title: 'GetPostOutput',
    description: 'Output schema for a retrieved post',
  });

// Update Post Input Schema
export const UpdatePostInputSchema = z
  .object({
    postId: z.string().uuid('Invalid post ID').openapi({
      description: 'UUID of the post to update',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    title: z
      .string()
      .min(1)
      .max(200)
      .optional()
      .openapi({
        description: 'New post title',
        example: 'Updated Title',
      }),
    content: z
      .string()
      .min(50)
      .optional()
      .openapi({
        description: 'New post content',
        example: 'This is the updated content with enough characters to pass validation.',
      }),
    published: z
      .boolean()
      .optional()
      .openapi({
        description: 'New publication status',
        example: true,
      }),
  })
  .openapi({
    title: 'UpdatePostInput',
    description: 'Input schema for updating a post',
  });

// Update Post Output Schema
export const UpdatePostOutputSchema = z
  .object({
    id: z.string().openapi({
      description: 'Unique identifier for the post',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    title: z.string().openapi({
      description: 'The updated title',
      example: 'Updated Title',
    }),
    content: z.string().openapi({
      description: 'The updated content',
      example: 'This is the updated content.',
    }),
    published: z.boolean().openapi({
      description: 'Publication status',
      example: true,
    }),
    updatedAt: z.string().openapi({
      description: 'ISO 8601 timestamp of update',
      example: '2024-01-01T12:00:00.000Z',
    }),
  })
  .openapi({
    title: 'UpdatePostOutput',
    description: 'Output schema for an updated post',
  });

// Delete Post Input Schema
export const DeletePostInputSchema = z
  .object({
    postId: z.string().uuid('Invalid post ID').openapi({
      description: 'UUID of the post to delete',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  })
  .openapi({
    title: 'DeletePostInput',
    description: 'Input schema for deleting a post',
  });

// Delete Post Output Schema
export const DeletePostOutputSchema = z
  .object({
    deleted: z.boolean().openapi({
      description: 'Whether the deletion was successful',
      example: true,
    }),
    postId: z.string().openapi({
      description: 'UUID of the deleted post',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    deletedAt: z.string().openapi({
      description: 'ISO 8601 timestamp of deletion',
      example: '2024-01-01T12:00:00.000Z',
    }),
  })
  .openapi({
    title: 'DeletePostOutput',
    description: 'Output schema for a deleted post',
  });

// Search Posts Input Schema
export const SearchPostsInputSchema = z
  .object({
    query: z
      .string()
      .min(1, 'Search query is required')
      .max(100, 'Query too long')
      .openapi({
        description: 'Search query string',
        example: 'typescript',
      }),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .openapi({
        description: 'Maximum number of results to return',
        example: 20,
      }),
  })
  .openapi({
    title: 'SearchPostsInput',
    description: 'Input schema for searching posts',
  });

// Search Posts Output Schema
export const SearchPostsOutputSchema = z
  .object({
    results: z
      .array(
        z
          .object({
            id: z.string().openapi({
              description: 'Unique identifier for the post',
              example: 'post-1',
            }),
            title: z.string().openapi({
              description: 'The title of the post',
              example: 'Search Result 1',
            }),
            slug: z.string().openapi({
              description: 'URL-friendly slug',
              example: 'search-result-1',
            }),
            published: z.boolean().openapi({
              description: 'Publication status',
              example: true,
            }),
          })
          .openapi({
            title: 'PostSearchResult',
            description: 'A single post in search results',
          })
      )
      .openapi({
        description: 'Array of matching posts',
      }),
    total: z.number().openapi({
      description: 'Total number of matching posts',
      example: 2,
    }),
  })
  .openapi({
    title: 'SearchPostsOutput',
    description: 'Output schema for post search results',
  });

