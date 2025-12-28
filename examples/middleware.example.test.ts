/**
 * Tests for middleware.example.ts
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
import { createItem } from './middleware.example';
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('middleware.example', () => {
  it('should create item with middleware context', async () => {
    const result = await createItem({
      name: 'Example Item',
      description: 'This is an example item with enough characters.',
    });

    type CreateItemResult = InferSafeActionFnResult<typeof createItem>;
    const typedResult: CreateItemResult = result;

    expect(typedResult.data).toBeDefined();
    expect(typedResult.data?.name).toBe('Example Item');
    expect(typedResult.data?.requestId).toBeDefined();
    expect(typedResult.data?.timestamp).toBeDefined();
    expect(typedResult.fieldErrors).toBeUndefined();
  });
});

