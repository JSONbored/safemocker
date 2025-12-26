<div align="center">

![safemocker](https://socialify.git.ci/JSONbored/safemocker/image?custom_description=Type-safe+mock+for+next-safe-action+v8.&description=1&font=Source+Code+Pro&forks=1&issues=1&name=1&owner=1&pattern=Plus&pulls=1&stargazers=1&theme=Dark)

[![npm version](https://img.shields.io/npm/v/@jsonbored/safemocker?style=flat-square)](https://www.npmjs.com/package/@jsonbored/safemocker)
[![npm downloads](https://img.shields.io/npm/dm/@jsonbored/safemocker?style=flat-square)](https://www.npmjs.com/package/@jsonbored/safemocker)
[![License](https://img.shields.io/npm/l/@jsonbored/safemocker?style=flat-square)](https://github.com/JSONbored/safemocker/blob/main/LICENSE)

[![CI](https://github.com/JSONbored/safemocker/workflows/CI/badge.svg?style=flat-square)](https://github.com/JSONbored/safemocker/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)

`safemocker` solves the critical problem of testing [next-safe-action](https://github.com/TheEdoRan/next-safe-action) v8 in Jest environments where ESM modules (`.mjs` files) cannot be directly imported. It provides a comprehensive mocking solution that's type-safe, robust, and extensive, allowing easy testing for all next-safe-action usage throughout your project.

</div>

## 📑 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [📚 Quick Start Guide](#-quick-start-guide)
  - [Jest Integration](#jest-integration)
  - [Vitest Integration](#vitest-integration)
- [📖 API Reference](#-api-reference)
  - [Factory Functions](#factory-functions)
  - [Configuration Options](#configuration-options)
- [💡 Usage Examples](#-usage-examples)
  - [Basic Action Testing](#basic-action-testing)
  - [Validation Error Testing](#validation-error-testing)
  - [Error Handling Testing](#error-handling-testing)
  - [Custom Middleware Testing](#custom-middleware-testing)
  - [Complex Integration Testing](#complex-integration-testing)
  - [Discriminated Unions & Complex Validation](#discriminated-unions--complex-validation)
  - [Partial Updates & Batch Operations](#partial-updates--batch-operations)
- [🚀 Advanced Features](#-advanced-features)
  - [Nested Validation Errors](#nested-validation-errors)
  - [Discriminated Unions](#discriminated-unions)
  - [Array Validation](#array-validation)
  - [Rate Limited Actions](#rate-limited-actions)
- [⚙️ How It Works](#️-how-it-works)
  - [Method Chaining](#method-chaining)
  - [Middleware Chain Execution](#middleware-chain-execution)
  - [SafeActionResult Structure](#safeactionresult-structure)
- [📁 Example Files](#-example-files)
- [⚠️ Caveats & Considerations](#️-caveats--considerations)
- [🔧 Troubleshooting](#-troubleshooting)
- [🔄 Migration Guide](#-migration-guide)
- [🤝 Contributing](#-contributing)
- [🔗 Related Projects](#-related-projects)

## ✨ Features

- ✅ **Works with Jest** - Solves ESM compatibility issues (primary use case)
- ✅ **Works with Vitest** - Even with ESM support, mocking provides faster tests, easier control, consistent patterns, and better error scenario testing
- ✅ **Replicates real middleware behavior** - Auth, validation, error handling work exactly like the real library
- ✅ **Returns proper SafeActionResult structure** - Type-safe, matches real API exactly
- ✅ **Type-safe API** - Full TypeScript integration with proper inference
- ✅ **Easy to use** - Similar to [Prismocker](https://github.com/JSONbored/prismocker) pattern, minimal setup required
- ✅ **Standalone package** - Can be extracted to separate repo for OSS distribution

## 🚀 Quick Start

```typescript
import { createAuthedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

// Create authenticated action client
const authedAction = createAuthedActionClient();

// Define your action
const createUser = authedAction
  .inputSchema(z.object({ name: z.string().min(1), email: z.string().email() }))
  .metadata({ actionName: 'createUser', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return { id: 'new-id', ...parsedInput, createdBy: ctx.userId };
  });

// Test it!
const result = await createUser({ name: 'John', email: 'john@example.com' });
expect(result.data).toEqual({ id: 'new-id', name: 'John', email: 'john@example.com', createdBy: 'test-user-id' });
```

## 📦 Installation

```bash
npm install --save-dev @jsonbored/safemocker
# or
pnpm add -D @jsonbored/safemocker
# or
yarn add -D @jsonbored/safemocker
```

## 📚 Quick Start Guide

<details>
<summary><strong>Jest Integration</strong></summary>

### Step 1: Create Mock File

Create `__mocks__/next-safe-action.ts` in your project root:

```typescript
import { createMockSafeActionClient } from '@jsonbored/safemocker/jest';

export const createSafeActionClient = createMockSafeActionClient({
  defaultServerError: 'Something went wrong',
  isProduction: false,
  auth: {
    enabled: true,
    testUserId: 'test-user-id',
    testUserEmail: 'test@example.com',
    testAuthToken: 'test-token',
  },
});

export const DEFAULT_SERVER_ERROR_MESSAGE = 'Something went wrong';
```

### Step 2: Use in Tests

```typescript
// Your test file
import { authedAction } from './safe-action'; // Your real safe-action.ts file
import { z } from 'zod';

// Create action using REAL safe-action.ts (which uses mocked next-safe-action)
const testAction = authedAction
  .inputSchema(z.object({ id: z.string() }))
  .metadata({ actionName: 'testAction', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return { id: parsedInput.id, userId: ctx.userId };
  });

// Test SafeActionResult structure
const result = await testAction({ id: '123' });
expect(result.data).toEqual({ id: '123', userId: 'test-user-id' });
expect(result.serverError).toBeUndefined();
expect(result.fieldErrors).toBeUndefined();
```

### Step 3: Verify Jest Auto-Mock

Jest will automatically use `__mocks__/next-safe-action.ts` when you import `next-safe-action` in your code. No additional configuration needed!

</details>

<details>
<summary><strong>Vitest Integration</strong></summary>

### Step 1: Create Mock Setup

Create `vitest.setup.ts` or add to your test file:

```typescript
import { vi } from 'vitest';
import { createMockSafeActionClient } from '@jsonbored/safemocker/vitest';

vi.mock('next-safe-action', () => {
  return {
    createSafeActionClient: createMockSafeActionClient({
      defaultServerError: 'Something went wrong',
      isProduction: false,
      auth: {
        enabled: true,
        testUserId: 'test-user-id',
        testUserEmail: 'test@example.com',
        testAuthToken: 'test-token',
      },
    }),
    DEFAULT_SERVER_ERROR_MESSAGE: 'Something went wrong',
  };
});
```

### Step 2: Use in Tests

```typescript
// Your test file
import { authedAction } from './safe-action'; // Your real safe-action.ts file
import { z } from 'zod';

// Create action using REAL safe-action.ts (which uses mocked next-safe-action)
const testAction = authedAction
  .inputSchema(z.object({ id: z.string() }))
  .metadata({ actionName: 'testAction', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return { id: parsedInput.id, userId: ctx.userId };
  });

// Test SafeActionResult structure
const result = await testAction({ id: '123' });
expect(result.data).toEqual({ id: '123', userId: 'test-user-id' });
expect(result.serverError).toBeUndefined();
expect(result.fieldErrors).toBeUndefined();
```

### Step 3: Configure Vitest

If using `vitest.setup.ts`, add it to your `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

</details>

## 📖 API Reference

### Factory Functions

<details>
<summary><strong>createMockSafeActionClient(config?)</strong></summary>

Creates a basic mock safe action client.

```typescript
import { createMockSafeActionClient } from '@jsonbored/safemocker/jest'; // or 'safemocker/vitest'

const client = createMockSafeActionClient({
  defaultServerError: 'Something went wrong',
  isProduction: false,
  auth: {
    enabled: true,
    testUserId: 'test-user-id',
    testUserEmail: 'test@example.com',
    testAuthToken: 'test-token',
  },
});
```

</details>

<details>
<summary><strong>createAuthedActionClient(config?)</strong></summary>

Creates a mock client with authentication middleware pre-configured.

```typescript
import { createAuthedActionClient } from '@jsonbored/safemocker/jest';

const authedAction = createAuthedActionClient({
  auth: {
    testUserId: 'custom-user-id',
  },
});

const action = authedAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    // ctx.userId, ctx.userEmail, ctx.authToken are available
    return { id: parsedInput.id, userId: ctx.userId };
  });
```

</details>

<details>
<summary><strong>createOptionalAuthActionClient(config?)</strong></summary>

Creates a mock client with optional authentication middleware.

```typescript
import { createOptionalAuthActionClient } from '@jsonbored/safemocker/jest';

const optionalAuthAction = createOptionalAuthActionClient();

const action = optionalAuthAction
  .inputSchema(z.object({ query: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    // ctx.user may be null, ctx.userId may be undefined
    return { query: parsedInput.query, userId: ctx.userId };
  });
```

</details>

<details>
<summary><strong>createRateLimitedActionClient(metadataSchema?, config?)</strong></summary>

Creates a mock client with rate limiting middleware.

```typescript
import { createRateLimitedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

const metadataSchema = z.object({
  actionName: z.string().min(1),
  category: z.enum(['user', 'admin']).optional(),
});

const rateLimitedAction = createRateLimitedActionClient(metadataSchema);

const action = rateLimitedAction
  .inputSchema(z.object({ query: z.string() }))
  .metadata({ actionName: 'search', category: 'content' })
  .action(async ({ parsedInput }) => {
    return { results: [] };
  });
```

</details>

<details>
<summary><strong>createCompleteActionClient(metadataSchema, config?)</strong></summary>

Creates all action client variants matching your real `safe-action.ts` pattern.

```typescript
import { createCompleteActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

const metadataSchema = z.object({
  actionName: z.string().min(1),
  category: z.enum(['user', 'admin', 'content']).optional(),
});

const {
  actionClient,
  loggedAction,
  rateLimitedAction,
  authedAction,
  optionalAuthAction,
} = createCompleteActionClient(metadataSchema, {
  auth: {
    testUserId: 'test-user-id',
  },
});

// Use exactly like your real safe-action.ts
const action = authedAction
  .inputSchema(z.object({ id: z.string() }))
  .metadata({ actionName: 'test' })
  .action(async ({ parsedInput, ctx }) => {
    return { id: parsedInput.id, userId: ctx.userId };
  });
```

</details>

### Configuration Options

<details>
<summary><strong>MockSafeActionClientConfig</strong></summary>

```typescript
interface MockSafeActionClientConfig {
  defaultServerError?: string;        // Default: 'Something went wrong'
  isProduction?: boolean;              // Default: false
  auth?: {
    enabled?: boolean;                 // Default: true
    testUserId?: string;               // Default: 'test-user-id'
    testUserEmail?: string;            // Default: 'test@example.com'
    testAuthToken?: string;            // Default: 'test-token'
  };
}
```

</details>

## 💡 Usage Examples

<details>
<summary><strong>Basic Action Testing</strong></summary>

```typescript
import { createAuthedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

const authedAction = createAuthedActionClient();

const createUser = authedAction
  .inputSchema(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
    })
  )
  .metadata({ actionName: 'createUser', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return {
      id: 'new-user-id',
      name: parsedInput.name,
      email: parsedInput.email,
      createdBy: ctx.userId,
    };
  });

// Test
const result = await createUser({
  name: 'John Doe',
  email: 'john@example.com',
});

expect(result.data).toEqual({
  id: 'new-user-id',
  name: 'John Doe',
  email: 'john@example.com',
  createdBy: 'test-user-id',
});
```

</details>

<details>
<summary><strong>Validation Error Testing</strong></summary>

```typescript
import { createAuthedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

const authedAction = createAuthedActionClient();

const updateProfile = authedAction
  .inputSchema(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
    })
  )
  .action(async ({ parsedInput }) => {
    return { success: true };
  });

// Test validation errors
const result = await updateProfile({
  name: '', // Invalid: min length
  email: 'invalid-email', // Invalid: not an email
});

expect(result.fieldErrors).toBeDefined();
expect(result.fieldErrors?.name).toBeDefined();
expect(result.fieldErrors?.email).toBeDefined();
expect(result.data).toBeUndefined();
```

</details>

<details>
<summary><strong>Error Handling Testing</strong></summary>

```typescript
import { createAuthedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

const authedAction = createAuthedActionClient({
  defaultServerError: 'Something went wrong',
  isProduction: false, // Use error message in development
});

const deleteItem = authedAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async () => {
    throw new Error('Item not found');
  });

// Test error handling
const result = await deleteItem({ id: 'test-id' });

expect(result.serverError).toBe('Item not found');
expect(result.data).toBeUndefined();

// Test production mode (hides error details)
const prodAction = createAuthedActionClient({
  defaultServerError: 'Something went wrong',
  isProduction: true,
});

const prodResult = await prodAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async () => {
    throw new Error('Sensitive error details');
  })({ id: 'test' });

expect(prodResult.serverError).toBe('Something went wrong');
expect(prodResult.serverError).not.toBe('Sensitive error details');
```

</details>

<details>
<summary><strong>Custom Middleware Testing</strong></summary>

```typescript
import { createMockSafeActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

const client = createMockSafeActionClient();

// Add custom middleware
client.use(async ({ next, ctx = {} }) => {
  // Add custom context (next-safe-action format: { ctx: newContext })
  return next({ ctx: { ...ctx, customValue: 'test' } });
});

const action = client
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    return {
      id: parsedInput.id,
      customValue: ctx.customValue,
    };
  });

const result = await action({ id: 'test-id' });

expect(result.data).toEqual({
  id: 'test-id',
  customValue: 'test',
});
```

</details>

<details>
<summary><strong>Complex Integration Testing</strong></summary>

```typescript
import { createCompleteActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

const metadataSchema = z.object({
  actionName: z.string().min(1),
  category: z.enum(['user', 'admin']).optional(),
});

const { authedAction } = createCompleteActionClient(metadataSchema, {
  auth: {
    testUserId: 'user-123',
    testUserEmail: 'user@example.com',
  },
});

// Replicate your real safe-action.ts pattern
const updateJob = authedAction
  .inputSchema(
    z.object({
      jobId: z.string().uuid(),
      title: z.string().min(1),
      status: z.enum(['draft', 'published', 'archived']),
    })
  )
  .metadata({ actionName: 'updateJob', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    // Verify context is injected
    expect(ctx.userId).toBe('user-123');
    expect(ctx.userEmail).toBe('user@example.com');

    return {
      jobId: parsedInput.jobId,
      title: parsedInput.title,
      status: parsedInput.status,
      updatedBy: ctx.userId,
    };
  });

// Test success case
const successResult = await updateJob({
  jobId: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Software Engineer',
  status: 'published',
});

expect(successResult.data).toEqual({
  jobId: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Software Engineer',
  status: 'published',
  updatedBy: 'user-123',
});

// Test validation errors
const validationResult = await updateJob({
  jobId: 'invalid-uuid',
  title: '',
  status: 'invalid-status',
});

expect(validationResult.fieldErrors).toBeDefined();
expect(validationResult.fieldErrors?.jobId).toBeDefined();
expect(validationResult.fieldErrors?.title).toBeDefined();
expect(validationResult.fieldErrors?.status).toBeDefined();
```

</details>

<details>
<summary><strong>Discriminated Unions & Complex Validation</strong></summary>

```typescript
import { createAuthedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

const authedAction = createAuthedActionClient();

// Discriminated union for content types
const articleSchema = z.object({
  type: z.literal('article'),
  title: z.string().min(1),
  content: z.string().min(1),
  author: z.string().min(1),
});

const videoSchema = z.object({
  type: z.literal('video'),
  title: z.string().min(1),
  videoUrl: z.string().url(),
  duration: z.number().int().positive(),
});

const contentSchema = z.discriminatedUnion('type', [articleSchema, videoSchema]);

const createContent = authedAction
  .inputSchema(
    z.object({
      content: contentSchema,
      category: z.enum(['tech', 'business']),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    return {
      id: 'content-1',
      ...parsedInput.content,
      category: parsedInput.category,
      createdBy: ctx.userId,
    };
  });

// Test article content
const articleResult = await createContent({
  content: {
    type: 'article',
    title: 'Test Article',
    content: 'Article content...',
    author: 'John Doe',
  },
  category: 'tech',
});

expect(articleResult.data?.type).toBe('article');

// Test video content
const videoResult = await createContent({
  content: {
    type: 'video',
    title: 'Test Video',
    videoUrl: 'https://example.com/video.mp4',
    duration: 300,
  },
  category: 'tech',
});

expect(videoResult.data?.type).toBe('video');

// Test validation errors (nested fields use dot notation)
const invalidResult = await createContent({
  content: {
    type: 'article',
    title: '', // Invalid
    content: '', // Invalid
    author: '', // Invalid
  } as any,
  category: 'tech',
});

expect(invalidResult.fieldErrors?.['content.title']).toBeDefined();
expect(invalidResult.fieldErrors?.['content.content']).toBeDefined();
expect(invalidResult.fieldErrors?.['content.author']).toBeDefined();
```

</details>

<details>
<summary><strong>Partial Updates & Batch Operations</strong></summary>

```typescript
import { createAuthedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

const authedAction = createAuthedActionClient();

// Partial update action
const updateContent = authedAction
  .inputSchema(
    z.object({
      contentId: z.string().uuid(),
      updates: z.object({
        title: z.string().min(1).optional(),
        published: z.boolean().optional(),
        tags: z.array(z.string()).max(10).optional(),
      }),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    return {
      id: parsedInput.contentId,
      updatedFields: Object.keys(parsedInput.updates),
      updatedBy: ctx.userId,
    };
  });

// Test partial update
const result = await updateContent({
  contentId: '123e4567-e89b-12d3-a456-426614174000',
  updates: {
    title: 'Updated Title',
    published: true,
  },
});

expect(result.data?.updatedFields).toContain('title');
expect(result.data?.updatedFields).toContain('published');

// Batch update action
const batchUpdate = authedAction
  .inputSchema(
    z.object({
      updates: z.array(
        z.object({
          contentId: z.string().uuid(),
          updates: z.object({
            title: z.string().min(1).optional(),
          }),
        })
      ).min(1).max(50),
    })
  )
  .action(async ({ parsedInput }) => {
    return {
      totalUpdated: parsedInput.updates.length,
      updated: parsedInput.updates.map((u) => u.contentId),
    };
  });

// Test batch update
const batchResult = await batchUpdate({
  updates: [
    { contentId: 'id-1', updates: { title: 'Title 1' } },
    { contentId: 'id-2', updates: { title: 'Title 2' } },
  ],
});

expect(batchResult.data?.totalUpdated).toBe(2);
```

</details>

## 🚀 Advanced Features

<details>
<summary><strong>Nested Validation Errors</strong></summary>

When using nested objects in your schemas, validation errors use dot notation for field paths:

```typescript
const schema = z.object({
  content: z.object({
    title: z.string().min(1),
    author: z.string().min(1),
  }),
});

// Invalid input
const result = await action({
  content: {
    title: '', // Invalid
    author: '', // Invalid
  },
});

// Field errors use dot notation
expect(result.fieldErrors?.['content.title']).toBeDefined();
expect(result.fieldErrors?.['content.author']).toBeDefined();
```

</details>

<details>
<summary><strong>Discriminated Unions</strong></summary>

`safemocker` fully supports Zod discriminated unions:

```typescript
const contentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('article'), content: z.string() }),
  z.object({ type: z.literal('video'), videoUrl: z.string().url() }),
]);

const action = client
  .inputSchema(z.object({ content: contentSchema }))
  .action(async ({ parsedInput }) => {
    // TypeScript knows the discriminated union type
    if (parsedInput.content.type === 'article') {
      // parsedInput.content.content is available
    } else {
      // parsedInput.content.videoUrl is available
    }
  });
```

</details>

<details>
<summary><strong>Array Validation</strong></summary>

Complex array validation with nested items:

```typescript
const schema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1),
    })
  ).min(1).max(50),
});

// Validation errors for arrays
const result = await action({ items: [] }); // Invalid: min 1
expect(result.fieldErrors?.items).toBeDefined();
```

</details>

<details>
<summary><strong>Rate Limited Actions</strong></summary>

Rate limiting middleware is included in `rateLimitedAction`:

```typescript
import { createRateLimitedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

const metadataSchema = z.object({
  actionName: z.string().min(1),
  category: z.enum(['content', 'user']).optional(),
});

const rateLimitedAction = createRateLimitedActionClient(metadataSchema);

const searchAction = rateLimitedAction
  .inputSchema(z.object({ query: z.string() }))
  .metadata({ actionName: 'search', category: 'content' })
  .action(async ({ parsedInput }) => {
    return { results: [] };
  });
```

</details>

## ⚙️ How It Works

<details>
<summary><strong>Method Chaining</strong></summary>

`safemocker` replicates the exact method chaining pattern of `next-safe-action`:

```typescript
client
  .inputSchema(zodSchema)      // Step 1: Define input validation
  .metadata(metadata)          // Step 2: Add metadata (optional)
  .action(handler)              // Step 3: Define action handler
```

</details>

<details>
<summary><strong>Middleware Chain Execution</strong></summary>

1. **Input Validation** - Zod schema validation happens first
2. **Middleware Execution** - Middleware runs in order, each can modify context
3. **Handler Execution** - Action handler runs with validated input and context
4. **Result Wrapping** - Handler result is wrapped in `SafeActionResult` structure
5. **Error Handling** - Any errors are caught and converted to `serverError`

</details>

<details>
<summary><strong>SafeActionResult Structure</strong></summary>

All actions return a `SafeActionResult<TData>`:

```typescript
interface SafeActionResult<TData> {
  data?: TData;                              // Success data
  serverError?: string;                       // Server error message
  fieldErrors?: Record<string, string[]>;     // Validation errors by field
  validationErrors?: Record<string, string[]>; // General validation errors
}
```

</details>

## 📁 Example Files

The `safemocker` package includes comprehensive examples with full test coverage:

<details>
<summary><strong>examples/safe-action.ts</strong></summary>

Real-world `safe-action.ts` pattern using mocked `next-safe-action`. Demonstrates:
- Base action client creation
- Metadata schema definition
- Error handling configuration
- Middleware chaining
- Complete action client factory pattern

**Test Coverage:** `__tests__/real-integration.test.ts` (comprehensive integration tests)

</details>

<details>
<summary><strong>examples/user-actions.ts</strong></summary>

User management actions demonstrating common patterns:
- **`createUser`** - Authentication required, input validation, context injection
- **`getUserProfile`** - Optional authentication, UUID validation
- **`updateUserSettings`** - Partial updates, enum validation
- **`deleteUser`** - Admin-only pattern, UUID validation

**Test Coverage:** `__tests__/real-integration.test.ts`

</details>

<details>
<summary><strong>examples/content-actions.ts</strong></summary>

Complex content management actions demonstrating advanced v8 features:
- **`createContent`** - Discriminated unions (article, video, podcast), nested validation, array constraints
- **`updateContent`** - Partial updates with optional fields, UUID validation
- **`batchUpdateContent`** - Array validation with complex items, batch operations
- **`searchContent`** - Rate limiting, complex query validation, pagination, filtering
- **`getContentWithRelations`** - Optional authentication, nested relations, conditional data

**Features Demonstrated:**
- ✅ Discriminated unions with type-specific validation
- ✅ Nested object validation (dot notation for errors)
- ✅ Array validation with min/max constraints
- ✅ Partial updates with optional fields
- ✅ Batch operations with array validation
- ✅ Complex query parameters with defaults
- ✅ Rate limiting middleware
- ✅ Optional authentication with conditional logic
- ✅ Nested relations and conditional data inclusion

**Test Coverage:** `__tests__/content-actions.test.ts` (30 comprehensive tests, all passing)

</details>

## ⚠️ Caveats & Considerations

<details>
<summary><strong>Jest ESM Limitations</strong></summary>

**Problem:** Jest cannot directly import ESM modules (`.mjs` files) without experimental configuration. `next-safe-action` is ESM-only.

**Solution:** `safemocker` provides a CommonJS-compatible mock that Jest can import directly. Your real `safe-action.ts` file uses the mocked `next-safe-action`, so you test the real middleware logic with mocked dependencies.

**Important:** Always use your **real** `safe-action.ts` file in tests. Don't mock it - mock `next-safe-action` instead.

</details>

<details>
<summary><strong>Middleware Behavior Differences</strong></summary>

**Real `next-safe-action` middleware:**
- Executes in actual Next.js server environment
- Has access to `headers()`, `cookies()`, etc.
- Performs real authentication checks
- Makes real database calls

**safemocker middleware:**
- Executes in test environment
- Uses test configuration (test user IDs, etc.)
- Skips real authentication (injects test context)
- No real database calls

**Key Point:** The middleware **logic** is replicated, but the **implementation** uses test-friendly mocks. This allows you to test your action handlers with realistic middleware behavior without needing a full Next.js server environment.

</details>

<details>
<summary><strong>Type Safety</strong></summary>

`safemocker` maintains full type safety:

- ✅ Input schemas are type-checked
- ✅ Handler parameters are typed (`parsedInput`, `ctx`)
- ✅ Return types are inferred
- ✅ `SafeActionResult` is properly typed

**Note:** TypeScript may show errors in your IDE if `next-safe-action` types aren't available. This is expected - the runtime behavior is correct, and types are provided by `safemocker`.

</details>

<details>
<summary><strong>Production vs Development Error Messages</strong></summary>

**Development Mode (`isProduction: false`):**
- Error messages include full details
- Useful for debugging during development

**Production Mode (`isProduction: true`):**
- Error messages use `defaultServerError`
- Hides sensitive error details
- Matches real `next-safe-action` behavior

**Recommendation:** Use `isProduction: false` in tests to see actual error messages, but test both modes to ensure your error handling works correctly.

</details>

<details>
<summary><strong>Authentication in Tests</strong></summary>

**Default Behavior:**
- Authentication is **always successful** in tests
- Test user context is **always injected**
- No real authentication checks are performed

**Why:** In tests, you want to focus on testing your action logic, not authentication infrastructure. Real authentication should be tested separately with integration tests.

**Customization:**
- Set `auth.enabled: false` to disable auth middleware
- Set custom `testUserId`, `testUserEmail`, `testAuthToken` for different test scenarios
- Use different auth configs for different test suites

</details>

<details>
<summary><strong>Metadata Validation</strong></summary>

**Real `next-safe-action`:**
- Metadata validation happens in middleware
- Invalid metadata throws errors

**safemocker:**
- Metadata validation is replicated
- Use `createMetadataValidatedActionClient()` or `createCompleteActionClient()` with metadata schema
- Invalid metadata throws `'Invalid action metadata'` error

**Recommendation:** Always provide metadata in tests to match real usage patterns.

</details>

## 🔧 Troubleshooting

<details>
<summary><strong>Jest: "Cannot find module 'next-safe-action'"</strong></summary>

**Problem:** Jest cannot find the `next-safe-action` module.

**Solution:** Ensure your `__mocks__/next-safe-action.ts` file is in the correct location (project root or `__mocks__` directory at package level).

**Verify:**
```bash
# Check mock file exists
ls __mocks__/next-safe-action.ts

# Check Jest is using the mock
# Add console.log in your mock file to verify it's being loaded
```

</details>

<details>
<summary><strong>Vitest: Mock not working</strong></summary>

**Problem:** Vitest isn't using the mock.

**Solution:** Ensure `vi.mock('next-safe-action', ...)` is called before any imports that use `next-safe-action`.

**Best Practice:** Put mock setup in `vitest.setup.ts` or at the top of your test file before any imports.

</details>

<details>
<summary><strong>Type Errors: "Module has no exported member"</strong></summary>

**Problem:** TypeScript shows errors about missing exports from `next-safe-action`.

**Solution:** This is expected - `safemocker` provides runtime mocks, but TypeScript may not recognize them. The code will work correctly at runtime.

**Workaround:** Add type assertions if needed, but the runtime behavior is correct.

</details>

<details>
<summary><strong>Context not available in handler</strong></summary>

**Problem:** `ctx.userId` or other context values are undefined.

**Solution:** Ensure you're using `authedAction` or `optionalAuthAction` (not base `actionClient`), and that `auth.enabled` is `true` in config.

**Check:**
```typescript
const client = createAuthedActionClient({
  auth: {
    enabled: true, // Must be true
    testUserId: 'test-user-id',
  },
});
```

</details>

<details>
<summary><strong>Validation errors not appearing</strong></summary>

**Problem:** Invalid input doesn't return `fieldErrors`.

**Solution:** Ensure you're using `.inputSchema()` with a Zod schema. Validation happens automatically.

**Verify:**
```typescript
const action = client
  .inputSchema(z.object({ email: z.string().email() })) // Schema required
  .action(async ({ parsedInput }) => { ... });

const result = await action({ email: 'invalid' });
expect(result.fieldErrors).toBeDefined(); // Should have email error
```

</details>

<details>
<summary><strong>Nested validation errors use dot notation</strong></summary>

**Problem:** Testing nested validation errors but not finding them.

**Solution:** Nested fields use dot notation in `fieldErrors`.

**Example:**
```typescript
const schema = z.object({
  user: z.object({
    email: z.string().email(),
  }),
});

const result = await action({ user: { email: 'invalid' } });
// Use dot notation:
expect(result.fieldErrors?.['user.email']).toBeDefined();
// NOT: result.fieldErrors?.user?.email
```

</details>

## 🔄 Migration Guide

<details>
<summary><strong>From Manual Mocks</strong></summary>

**Before (Manual Mock):**
```typescript
vi.mock('./safe-action.ts', async () => {
  const createActionHandler = (inputSchema: any) => {
    return vi.fn((handler: any) => {
      return async (input: unknown) => {
        try {
          const parsed = inputSchema ? inputSchema.parse(input) : input;
          const result = await handler({
            parsedInput: parsed,
            ctx: { userId: 'test-user-id' },
          });
          return result;
        } catch (error) {
          throw error;
        }
      };
    });
  };
  // ... complex mock setup
});
```

**After (safemocker):**
```typescript
// __mocks__/next-safe-action.ts
import { createMockSafeActionClient } from '@jsonbored/safemocker/jest';

export const createSafeActionClient = createMockSafeActionClient({
  auth: { testUserId: 'test-user-id' },
});

// Use REAL safe-action.ts in tests
import { authedAction } from './safe-action';
```

**Benefits:**
- ✅ Less boilerplate
- ✅ Consistent SafeActionResult structure
- ✅ Real middleware behavior replication
- ✅ Type-safe
- ✅ Easier to maintain

</details>

## 🤝 Contributing

This package is designed to be standalone and extractable. Contributions welcome!

## License

MIT

## Author

JSONbored

## 🔗 Related Projects

- **[next-safe-action](https://github.com/TheEdoRan/next-safe-action)** - The real library being mocked
- **[Prismocker](https://github.com/JSONbored/prismocker)** - Similar type-safe mocking tool for Prisma Client (inspiration for this package)
- **[Claude Pro Directory](https://github.com/JSONbored/claudepro-directory)** - The parent project where safemocker and prismocker were originally developed
