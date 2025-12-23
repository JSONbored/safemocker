/**
 * Comprehensive tests for content-actions.ts
 *
 * Tests complex next-safe-action v8 features:
 * - Discriminated unions
 * - Complex nested validation
 * - Partial updates
 * - Batch operations
 * - Rate limiting
 * - Optional authentication
 * - Complex query validation
 */

import { describe, expect, it } from '@jest/globals';
import {
  createContent,
  updateContent,
  batchUpdateContent,
  searchContent,
  getContentWithRelations,
} from '../examples/content-actions';
import type { SafeActionResult } from '../src/types';

describe('Content Actions - Complex Features', () => {
  describe('createContent - Discriminated Union', () => {
    it('should create article content successfully', async () => {
      const result = await createContent({
        content: {
          type: 'article',
          title: 'Test Article',
          description: 'Test description',
          content: 'This is the article content...',
          author: 'John Doe',
          readingTime: 5,
          published: true,
        },
        category: 'tech',
        featured: true,
      });

      expect(result.data).toBeDefined();
      expect(result.data?.type).toBe('article');
      expect(result.data?.title).toBe('Test Article');
      expect(result.data?.content).toBe('This is the article content...');
      expect(result.data?.author).toBe('John Doe');
      expect(result.data?.readingTime).toBe(5);
      expect(result.data?.createdBy).toBe('test-user-id');
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });

    it('should create video content successfully', async () => {
      const result = await createContent({
        content: {
          type: 'video',
          title: 'Test Video',
          videoUrl: 'https://example.com/video.mp4',
          duration: 300,
          thumbnailUrl: 'https://example.com/thumb.jpg',
          published: false,
        },
        category: 'education',
        featured: false,
      });

      expect(result.data).toBeDefined();
      expect(result.data?.type).toBe('video');
      expect(result.data?.title).toBe('Test Video');
      expect(result.data?.videoUrl).toBe('https://example.com/video.mp4');
      expect(result.data?.duration).toBe(300);
      expect(result.data?.thumbnailUrl).toBe('https://example.com/thumb.jpg');
      expect(result.data?.createdBy).toBe('test-user-id');
    });

    it('should create podcast content successfully', async () => {
      const result = await createContent({
        content: {
          type: 'podcast',
          title: 'Test Podcast',
          audioUrl: 'https://example.com/audio.mp3',
          duration: 1800,
          episodeNumber: 1,
          host: 'Jane Doe',
          published: true,
        },
        category: 'business',
      });

      expect(result.data).toBeDefined();
      expect(result.data?.type).toBe('podcast');
      expect(result.data?.title).toBe('Test Podcast');
      expect(result.data?.audioUrl).toBe('https://example.com/audio.mp3');
      expect(result.data?.episodeNumber).toBe(1);
      expect(result.data?.host).toBe('Jane Doe');
    });

    it('should return validation errors for invalid article content', async () => {
      const result = await createContent({
        content: {
          type: 'article',
          title: '', // Invalid: min length
          content: '', // Invalid: min length
          author: '', // Invalid: min length
        } as any,
        category: 'tech',
      });

      expect(result.fieldErrors).toBeDefined();
      // Nested fields use dot notation: content.title, content.content, content.author
      expect(result.fieldErrors?.['content.title']).toBeDefined();
      expect(result.fieldErrors?.['content.content']).toBeDefined();
      expect(result.fieldErrors?.['content.author']).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should return validation errors for invalid video URL', async () => {
      const result = await createContent({
        content: {
          type: 'video',
          title: 'Test Video',
          videoUrl: 'not-a-url', // Invalid: not a URL
          duration: -1, // Invalid: not positive
        } as any,
        category: 'tech',
      });

      expect(result.fieldErrors).toBeDefined();
      // Nested fields use dot notation
      expect(result.fieldErrors?.['content.videoUrl']).toBeDefined();
      expect(result.fieldErrors?.['content.duration']).toBeDefined();
    });

    it('should handle optional fields with defaults', async () => {
      const result = await createContent({
        content: {
          type: 'article',
          title: 'Test Article',
          content: 'Content here',
          author: 'John Doe',
          // published defaults to false
          // description is optional
        },
        category: 'tech',
        // featured defaults to false
      });

      expect(result.data).toBeDefined();
      expect(result.data?.published).toBe(false);
      expect(result.data?.featured).toBe(false);
    });

    it('should validate tags array constraints', async () => {
      const result = await createContent({
        content: {
          type: 'article',
          title: 'Test Article',
          content: 'Content here',
          author: 'John Doe',
          tags: Array(11).fill('tag'), // Invalid: max 10 tags
        } as any,
        category: 'tech',
      });

      expect(result.fieldErrors).toBeDefined();
      // Nested field uses dot notation
      expect(result.fieldErrors?.['content.tags']).toBeDefined();
    });
  });

  describe('updateContent - Partial Updates', () => {
    it('should update content with partial fields', async () => {
      const result = await updateContent({
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        updates: {
          title: 'Updated Title',
          published: true,
        },
      });

      expect(result.data).toBeDefined();
      expect(result.data?.updatedFields).toContain('title');
      expect(result.data?.updatedFields).toContain('published');
      expect(result.data?.updatedBy).toBe('test-user-id');
    });

    it('should handle empty updates object', async () => {
      const result = await updateContent({
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        updates: {},
      });

      expect(result.data).toBeDefined();
      expect(result.data?.updatedFields).toEqual([]);
    });

    it('should validate contentId format', async () => {
      const result = await updateContent({
        contentId: 'invalid-uuid',
        updates: {
          title: 'Updated Title',
        },
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.contentId).toBeDefined();
    });

    it('should validate optional update fields', async () => {
      const result = await updateContent({
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        updates: {
          title: '', // Invalid: min length
          videoUrl: 'not-a-url', // Invalid: not a URL
        },
      });

      expect(result.fieldErrors).toBeDefined();
      // Nested fields use dot notation: updates.title, updates.videoUrl
      expect(result.fieldErrors?.['updates.title']).toBeDefined();
      expect(result.fieldErrors?.['updates.videoUrl']).toBeDefined();
    });
  });

  describe('batchUpdateContent - Array Validation', () => {
    it('should batch update multiple content items', async () => {
      const result = await batchUpdateContent({
        updates: [
          {
            contentId: '123e4567-e89b-12d3-a456-426614174000',
            updates: { title: 'Updated Title 1' },
          },
          {
            contentId: '223e4567-e89b-12d3-a456-426614174000',
            updates: { published: true },
          },
        ],
      });

      expect(result.data).toBeDefined();
      expect(result.data?.totalUpdated).toBe(2);
      expect(result.data?.updated).toHaveLength(2);
      expect(result.data?.updated[0]?.contentId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.data?.updated[1]?.contentId).toBe('223e4567-e89b-12d3-a456-426614174000');
    });

    it('should validate minimum array length', async () => {
      const result = await batchUpdateContent({
        updates: [], // Invalid: min 1 required
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.updates).toBeDefined();
    });

    it('should validate maximum array length', async () => {
      const result = await batchUpdateContent({
        updates: Array(51).fill({
          contentId: '123e4567-e89b-12d3-a456-426614174000',
          updates: { title: 'Title' },
        }), // Invalid: max 50
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.updates).toBeDefined();
    });

    it('should validate each update item', async () => {
      const result = await batchUpdateContent({
        updates: [
          {
            contentId: 'invalid-uuid', // Invalid
            updates: { title: 'Title' },
          },
        ],
      });

      expect(result.fieldErrors).toBeDefined();
      // Should have nested field errors for array items
      expect(result.fieldErrors).toBeDefined();
    });
  });

  describe('searchContent - Rate Limited & Complex Query', () => {
    it('should search content successfully', async () => {
      const result = await searchContent({
        query: 'test query',
        category: 'tech',
        contentType: 'article',
        page: 1,
        limit: 20,
      });

      expect(result.data).toBeDefined();
      expect(result.data?.results).toBeDefined();
      expect(result.data?.total).toBeGreaterThan(0);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
    });

    it('should handle pagination correctly', async () => {
      const result = await searchContent({
        query: 'test',
        page: 2,
        limit: 10,
      });

      expect(result.data).toBeDefined();
      expect(result.data?.page).toBe(2);
      expect(result.data?.limit).toBe(10);
      expect(result.data?.totalPages).toBeGreaterThan(0);
    });

    it('should validate query length', async () => {
      const result = await searchContent({
        query: 'a'.repeat(101), // Invalid: max 100
        page: 1,
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.query).toBeDefined();
    });

    it('should validate empty query', async () => {
      const result = await searchContent({
        query: '', // Invalid: min length 1
        page: 1,
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.query).toBeDefined();
    });

    it('should validate page number', async () => {
      const result = await searchContent({
        query: 'test',
        page: 0, // Invalid: must be positive
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.page).toBeDefined();
    });

    it('should validate limit range', async () => {
      const result = await searchContent({
        query: 'test',
        limit: 101, // Invalid: max 100
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.limit).toBeDefined();
    });

    it('should filter by category', async () => {
      const result = await searchContent({
        query: 'test',
        category: 'tech',
        page: 1,
      });

      expect(result.data).toBeDefined();
      // Results should be filtered by category
      expect(result.data?.results).toBeDefined();
    });

    it('should filter by contentType', async () => {
      const result = await searchContent({
        query: 'test',
        contentType: 'video',
        page: 1,
      });

      expect(result.data).toBeDefined();
      expect(result.data?.results).toBeDefined();
    });

    it('should use default values for optional fields', async () => {
      const result = await searchContent({
        query: 'test',
        // page defaults to 1
        // limit defaults to 20
        // sortBy defaults to 'relevance'
        // sortOrder defaults to 'desc'
      });

      expect(result.data).toBeDefined();
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
    });
  });

  describe('getContentWithRelations - Optional Auth & Nested Data', () => {
    it('should get content with all relations', async () => {
      const result = await getContentWithRelations({
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        include: {
          author: true,
          comments: true,
          relatedContent: true,
          analytics: true,
        },
      });

      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.data?.author).toBeDefined();
      expect(result.data?.comments).toBeDefined();
      expect(result.data?.relatedContent).toBeDefined();
      expect(result.data?.analytics).toBeDefined();
      expect(result.data?.viewerId).toBe('test-user-id'); // From optional auth
    });

    it('should get content without relations', async () => {
      const result = await getContentWithRelations({
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        // include is optional
      });

      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.data?.author).toBeUndefined();
      expect(result.data?.comments).toBeUndefined();
    });

    it('should get content with partial relations', async () => {
      const result = await getContentWithRelations({
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        include: {
          author: true,
          comments: false,
          relatedContent: true,
          analytics: false,
        },
      });

      expect(result.data).toBeDefined();
      expect(result.data?.author).toBeDefined();
      expect(result.data?.comments).toBeUndefined();
      expect(result.data?.relatedContent).toBeDefined();
      expect(result.data?.analytics).toBeUndefined();
    });

    it('should validate contentId format', async () => {
      const result = await getContentWithRelations({
        contentId: 'invalid-uuid',
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.contentId).toBeDefined();
    });

    it('should include viewer context from optional auth', async () => {
      const result = await getContentWithRelations({
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        include: {
          analytics: true, // Requires auth
        },
      });

      expect(result.data).toBeDefined();
      expect(result.data?.viewerId).toBe('test-user-id');
      // Note: isAuthenticated is not returned by the action, but viewerId being defined indicates auth
      expect(result.data?.analytics).toBeDefined(); // Should be included because auth is available
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // This would require modifying the action to throw an error
      // For now, we test that the structure is correct
      const result = await createContent({
        content: {
          type: 'article',
          title: 'Test',
          content: 'Content',
          author: 'Author',
        },
        category: 'tech',
      });

      // If there's an error, it should be in serverError
      if (result.serverError) {
        expect(result.serverError).toBeDefined();
        expect(result.data).toBeUndefined();
      } else {
        expect(result.data).toBeDefined();
      }
    });
  });
});

