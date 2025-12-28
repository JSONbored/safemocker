#!/usr/bin/env tsx

/**
 * Generate OpenAPI specification from Zod schemas in example actions
 * 
 * This script extracts Zod schemas from src/actions/actions.ts and generates
 * a comprehensive OpenAPI 3.1 specification that can be used with fumadocs-openapi.
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Import schemas with OpenAPI metadata from source
import {
  CreatePostInputSchema,
  CreatePostOutputSchema,
  GetPostInputSchema,
  GetPostOutputSchema,
  UpdatePostInputSchema,
  UpdatePostOutputSchema,
  DeletePostInputSchema,
  DeletePostOutputSchema,
  SearchPostsInputSchema,
  SearchPostsOutputSchema,
} from '../../src/actions/schemas';

const registry = new OpenAPIRegistry();

// Register all schemas
registry.register('CreatePostInput', CreatePostInputSchema);
registry.register('CreatePostOutput', CreatePostOutputSchema);
registry.register('GetPostInput', GetPostInputSchema);
registry.register('GetPostOutput', GetPostOutputSchema);
registry.register('UpdatePostInput', UpdatePostInputSchema);
registry.register('UpdatePostOutput', UpdatePostOutputSchema);
registry.register('DeletePostInput', DeletePostInputSchema);
registry.register('DeletePostOutput', DeletePostOutputSchema);
registry.register('SearchPostsInput', SearchPostsInputSchema);
registry.register('SearchPostsOutput', SearchPostsOutputSchema);

// Register error response schemas
/**
 * Validation error response schema.
 * Returned when input validation fails. Contains field-level error messages.
 */
const ValidationErrorSchema = z.object({
  fieldErrors: z
    .record(z.string(), z.array(z.string()))
    .describe('Object mapping field names to arrays of error messages'),
});

/**
 * Server error response schema.
 * Returned when an unexpected server error occurs.
 */
const ServerErrorSchema = z.object({
  serverError: z.string().describe('Human-readable error message describing what went wrong'),
});

/**
 * Unauthorized error response schema.
 * Returned when authentication is required but not provided or invalid.
 */
const UnauthorizedErrorSchema = z.object({
  serverError: z.string().describe('Error message indicating authentication is required or failed'),
});

/**
 * Forbidden error response schema.
 * Returned when the user is authenticated but lacks permission for the requested action.
 */
const ForbiddenErrorSchema = z.object({
  serverError: z.string().describe('Error message indicating the user lacks permission for this action'),
});

/**
 * Rate limit error response schema.
 * Returned when the rate limit has been exceeded.
 */
const RateLimitErrorSchema = z.object({
  serverError: z.string().describe('Error message indicating rate limit has been exceeded'),
});

registry.register('ValidationError', ValidationErrorSchema);
registry.register('ServerError', ServerErrorSchema);
registry.register('UnauthorizedError', UnauthorizedErrorSchema);
registry.register('ForbiddenError', ForbiddenErrorSchema);
registry.register('RateLimitError', RateLimitErrorSchema);

// Define paths using registry
registry.registerPath({
  method: 'post',
  path: '/actions/createPost',
  summary: 'Create a new post',
  description:
    'Creates a new post. Requires authentication. Validates input schema and returns the created post with full metadata. The action uses comprehensive Zod schema validation to ensure data integrity.',
  tags: ['posts'],
  operationId: 'createPost',
  security: [
    {
      bearerAuth: [],
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePostInputSchema,
          examples: {
            createPost: {
              summary: 'Create a new post',
              value: {
                title: 'My First Post',
                content: 'This is the content of my first post. It has enough characters to pass validation.',
                slug: 'my-first-post',
                published: true,
                tags: ['typescript', 'nextjs', 'testing'],
              },
            },
          },
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Post created successfully',
      headers: {
        'Content-Type': {
          description: 'Content type of the response',
          schema: { type: 'string', enum: ['application/json'] },
        },
      },
      content: {
        'application/json': {
          schema: CreatePostOutputSchema,
          examples: {
            success: {
              summary: 'Successful post creation',
              value: {
                id: 'post-1234567890',
                title: 'My First Post',
                content: 'This is the content of my first post. It has enough characters to pass validation.',
                slug: 'my-first-post',
                published: true,
                authorId: 'test-user-id',
                createdAt: '2024-01-01T00:00:00.000Z',
                tags: ['typescript', 'nextjs', 'testing'],
              },
            },
          },
        },
      },
    },
    '400': {
      description:
        'Bad Request - Input validation failed. The request body contains invalid data or missing required fields. Check the `fieldErrors` object for specific validation errors per field.',
      content: {
        'application/json': {
          schema: ValidationErrorSchema,
          examples: {
            validationError: {
              summary: 'Input validation failed - multiple fields',
              description: 'Example showing validation errors for multiple fields',
              value: {
                fieldErrors: {
                  title: ['Title is required'],
                  content: ['Content must be at least 50 characters'],
                  slug: ['Slug must be lowercase alphanumeric with hyphens'],
                },
              },
            },
            singleFieldError: {
              summary: 'Input validation failed - single field',
              description: 'Example showing validation error for a single field',
              value: {
                fieldErrors: {
                  title: ['Title must be between 1 and 200 characters'],
                },
              },
            },
            emptyTitle: {
              summary: 'Empty title validation error',
              description: 'Title field is required and cannot be empty',
              value: {
                fieldErrors: {
                  title: ['Title is required'],
                },
              },
            },
            invalidSlug: {
              summary: 'Invalid slug format',
              description: 'Slug must match the pattern: lowercase alphanumeric with hyphens only',
              value: {
                fieldErrors: {
                  slug: ['Slug must be lowercase alphanumeric with hyphens'],
                },
              },
            },
          },
        },
      },
    },
    '401': {
      description:
        'Unauthorized - Authentication is required but was not provided or is invalid. Include a valid Bearer token in the Authorization header.',
      content: {
        'application/json': {
          schema: UnauthorizedErrorSchema,
          examples: {
            noToken: {
              summary: 'No authentication token provided',
              description: 'Request made without Authorization header',
              value: {
                serverError: 'Authentication required',
              },
            },
            invalidToken: {
              summary: 'Invalid authentication token',
              description: 'Token provided but is invalid or expired',
              value: {
                serverError: 'Invalid or expired authentication token',
              },
            },
            missingAuth: {
              summary: 'Authentication required',
              description: 'This endpoint requires authentication',
              value: {
                serverError: 'Authentication required to perform this action',
              },
            },
          },
        },
      },
    },
    '500': {
      description:
        'Internal Server Error - An unexpected error occurred on the server. This is typically a temporary condition. If the error persists, please contact support.',
      content: {
        'application/json': {
          schema: ServerErrorSchema,
          examples: {
            serverError: {
              summary: 'Generic server error',
              description: 'An unexpected error occurred',
              value: {
                serverError: 'An unexpected error occurred. Please try again later.',
              },
            },
            databaseError: {
              summary: 'Database error',
              description: 'Error occurred while accessing the database',
              value: {
                serverError: 'Database connection error. Please try again later.',
              },
            },
            processingError: {
              summary: 'Processing error',
              description: 'Error occurred while processing the request',
              value: {
                serverError: 'Error processing request. Please try again later.',
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/actions/getPost',
  summary: 'Get a post by ID',
  description:
    'Retrieves a post by its UUID. Optional authentication - public posts don\'t require auth.',
  tags: ['posts'],
  operationId: 'getPost',
  request: {
    body: {
      content: {
        'application/json': {
          schema: GetPostInputSchema,
          examples: {
            getPost: {
              summary: 'Get post by ID',
              value: {
                postId: '123e4567-e89b-12d3-a456-426614174000',
              },
            },
          },
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Post retrieved successfully',
      content: {
        'application/json': {
          schema: GetPostOutputSchema,
          examples: {
            success: {
              summary: 'Post retrieved successfully',
              value: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                title: 'Example Post',
                content: 'This is the post content.',
                slug: 'example-post',
                published: true,
                authorId: 'author-123',
                isAuthor: false,
                viewerId: 'test-user-id',
                createdAt: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
    '400': {
      description:
        'Bad Request - Input validation failed. The postId must be a valid UUID format.',
      content: {
        'application/json': {
          schema: ValidationErrorSchema,
          examples: {
            invalidId: {
              summary: 'Invalid post ID format',
              description: 'Post ID must be a valid UUID',
              value: {
                fieldErrors: {
                  postId: ['Invalid post ID', 'Post ID must be a valid UUID'],
                },
              },
            },
            missingId: {
              summary: 'Missing post ID',
              description: 'Post ID is required',
              value: {
                fieldErrors: {
                  postId: ['Post ID is required'],
                },
              },
            },
          },
        },
      },
    },
    '500': {
      description: 'Server error',
      content: {
        'application/json': {
          schema: ServerErrorSchema,
          examples: {
            serverError: {
              summary: 'Internal server error',
              value: {
                serverError: 'Something went wrong',
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/actions/updatePost',
  summary: 'Update a post',
  description:
    'Updates an existing post. Requires authentication and authorization (user must own the post). The action validates both input and output schemas to ensure data integrity.',
  tags: ['posts'],
  operationId: 'updatePost',
  security: [
    {
      bearerAuth: [],
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdatePostInputSchema,
          examples: {
            updatePost: {
              summary: 'Update post',
              value: {
                postId: '123e4567-e89b-12d3-a456-426614174000',
                title: 'Updated Title',
                content: 'This is updated content with enough characters to pass validation requirements.',
                published: true,
              },
            },
          },
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Post updated successfully',
      content: {
        'application/json': {
          schema: UpdatePostOutputSchema,
          examples: {
            success: {
              summary: 'Post updated successfully',
              value: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                title: 'Updated Title',
                content: 'Updated content',
                published: true,
                updatedAt: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
    '400': {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ValidationErrorSchema,
          examples: {
            validationError: {
              summary: 'Invalid input',
              value: {
                fieldErrors: {
                  postId: ['Invalid post ID'],
                  title: ['Title must be less than 200 characters'],
                },
              },
            },
          },
        },
      },
    },
    '401': {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: z.object({ serverError: z.string() }),
          examples: {
            unauthorized: {
              summary: 'Authentication required',
              value: {
                serverError: 'Authentication required',
              },
            },
          },
        },
      },
    },
    '403': {
      description: 'Authorization failed - user does not own the post',
      content: {
        'application/json': {
          schema: z.object({ serverError: z.string() }),
          examples: {
            forbidden: {
              summary: 'Not authorized',
              value: {
                serverError: 'You do not have permission to update this post',
              },
            },
          },
        },
      },
    },
    '500': {
      description: 'Server error',
      content: {
        'application/json': {
          schema: ServerErrorSchema,
          examples: {
            serverError: {
              summary: 'Internal server error',
              value: {
                serverError: 'Something went wrong',
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/actions/deletePost',
  summary: 'Delete a post',
  description:
    'Deletes a post by its UUID. Requires authentication and authorization (user must own the post). The action validates the post ID format and ensures the user has permission to delete the post.',
  tags: ['posts'],
  operationId: 'deletePost',
  security: [
    {
      bearerAuth: [],
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: DeletePostInputSchema,
          examples: {
            deletePost: {
              summary: 'Delete post by ID',
              value: {
                postId: '123e4567-e89b-12d3-a456-426614174000',
              },
            },
          },
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Post deleted successfully',
      content: {
        'application/json': {
          schema: DeletePostOutputSchema,
          examples: {
            success: {
              summary: 'Post deleted successfully',
              value: {
                deleted: true,
                postId: '123e4567-e89b-12d3-a456-426614174000',
                deletedAt: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
    '400': {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ValidationErrorSchema,
          examples: {
            invalidId: {
              summary: 'Invalid post ID',
              value: {
                fieldErrors: {
                  postId: ['Invalid post ID'],
                },
              },
            },
          },
        },
      },
    },
    '401': {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: z.object({ serverError: z.string() }),
          examples: {
            unauthorized: {
              summary: 'Authentication required',
              value: {
                serverError: 'Authentication required',
              },
            },
          },
        },
      },
    },
    '403': {
      description: 'Authorization failed - user does not own the post',
      content: {
        'application/json': {
          schema: z.object({ serverError: z.string() }),
          examples: {
            forbidden: {
              summary: 'Not authorized',
              value: {
                serverError: 'You do not have permission to delete this post',
              },
            },
          },
        },
      },
    },
    '500': {
      description: 'Server error',
      content: {
        'application/json': {
          schema: ServerErrorSchema,
          examples: {
            serverError: {
              summary: 'Internal server error',
              value: {
                serverError: 'Something went wrong',
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/actions/searchPosts',
  summary: 'Search posts',
  description:
    'Searches posts by query string. Rate limited, optional authentication.',
  tags: ['search', 'posts'],
  operationId: 'searchPosts',
  request: {
    body: {
      content: {
        'application/json': {
          schema: SearchPostsInputSchema,
          examples: {
            searchPosts: {
              summary: 'Search posts',
              value: {
                query: 'typescript',
                limit: 10,
              },
            },
          },
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Search results',
      content: {
        'application/json': {
          schema: SearchPostsOutputSchema,
          examples: {
            success: {
              summary: 'Search results',
              value: {
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
              },
            },
          },
        },
      },
    },
    '400': {
      description:
        'Bad Request - Input validation failed. The query must be between 1 and 100 characters, and limit (if provided) must be between 1 and 50.',
      content: {
        'application/json': {
          schema: ValidationErrorSchema,
          examples: {
            invalidQuery: {
              summary: 'Invalid search query',
              description: 'Query is required and must be between 1 and 100 characters',
              value: {
                fieldErrors: {
                  query: ['Search query is required'],
                },
              },
            },
            queryTooLong: {
              summary: 'Query too long',
              description: 'Query exceeds maximum length of 100 characters',
              value: {
                fieldErrors: {
                  query: ['Query too long', 'Query must be less than 100 characters'],
                },
              },
            },
            invalidLimit: {
              summary: 'Invalid limit',
              description: 'Limit must be between 1 and 50',
              value: {
                fieldErrors: {
                  limit: ['Limit must be between 1 and 50'],
                },
              },
            },
            emptyQuery: {
              summary: 'Empty query',
              description: 'Query cannot be empty',
              value: {
                fieldErrors: {
                  query: ['Search query is required', 'Query cannot be empty'],
                },
              },
            },
          },
        },
      },
    },
    '429': {
      description:
        'Too Many Requests - Rate limit exceeded. The client has made too many requests in a given time period. Please wait before retrying.',
      content: {
        'application/json': {
          schema: RateLimitErrorSchema,
          examples: {
            rateLimited: {
              summary: 'Rate limit exceeded',
              description: 'Too many requests in a short time period',
              value: {
                serverError: 'Rate limit exceeded. Please try again later.',
              },
            },
            tooManyRequests: {
              summary: 'Too many requests',
              description: 'Rate limit has been exceeded for this endpoint',
              value: {
                serverError: 'Too many requests. Please wait a moment before trying again.',
              },
            },
          },
        },
      },
      headers: {
        'Retry-After': {
          description: 'Number of seconds to wait before retrying',
          schema: { type: 'integer', example: 60 },
        },
        'X-RateLimit-Limit': {
          description: 'Maximum number of requests allowed per time window',
          schema: { type: 'integer', example: 100 },
        },
        'X-RateLimit-Remaining': {
          description: 'Number of requests remaining in the current time window',
          schema: { type: 'integer', example: 0 },
        },
        'X-RateLimit-Reset': {
          description: 'Unix timestamp when the rate limit resets',
          schema: { type: 'integer', example: 1609459200 },
        },
      },
    },
    '500': {
      description: 'Server error',
      content: {
        'application/json': {
          schema: ServerErrorSchema,
          examples: {
            serverError: {
              summary: 'Internal server error',
              value: {
                serverError: 'Something went wrong',
              },
            },
          },
        },
      },
    },
  },
});

// Generate OpenAPI document
const generator = new OpenApiGeneratorV31(registry.definitions);

const openApiDocument = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'safemocker Example Actions API',
    version: '0.2.0',
    description:
      'API documentation for example server actions using next-safe-action with safemocker. These actions demonstrate real-world usage patterns with comprehensive Zod schema validation. All schemas are generated from Zod with full type safety and validation.',
    contact: {
      name: 'safemocker',
      url: 'https://github.com/JSONbored/safemocker',
      email: 'support@zeronode.sh',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    termsOfService: 'https://safemocker.zeronode.sh/docs',
  },
  servers: [
    {
      url: 'https://safemocker.zeronode.sh',
      description: 'Production',
    },
    {
      url: 'http://localhost:3000',
      description: 'Development',
    },
  ],
  tags: [
    {
      name: 'posts',
      description: 'Post management operations - create, read, update, delete posts',
      externalDocs: {
        description: 'Learn more about post actions',
        url: 'https://safemocker.zeronode.sh/docs/examples/production-actions',
      },
    },
    {
      name: 'search',
      description: 'Search and discovery operations for finding posts',
      externalDocs: {
        description: 'Learn more about search functionality',
        url: 'https://safemocker.zeronode.sh/docs/examples/production-actions',
      },
    },
  ],
  externalDocs: {
    description: 'Complete safemocker documentation',
    url: 'https://safemocker.zeronode.sh/docs',
  },
});

// Add security schemes to the document
if (!openApiDocument.components) {
  openApiDocument.components = {};
}
if (!openApiDocument.components.securitySchemes) {
  openApiDocument.components.securitySchemes = {};
}
openApiDocument.components.securitySchemes.bearerAuth = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Bearer token authentication. Include the token in the Authorization header as: Bearer <token>',
};

// Write OpenAPI document to file
const outputPath = join(process.cwd(), 'openapi.json');

async function main() {
  await writeFile(outputPath, JSON.stringify(openApiDocument, null, 2));
  console.log(`✅ OpenAPI specification generated: ${outputPath}`);
}

main().catch((error) => {
  console.error('❌ Error generating OpenAPI spec:', error);
  process.exit(1);
});

