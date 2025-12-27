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

## 📦 Installation

```bash
npm install --save-dev @jsonbored/safemocker
# or
pnpm add -D @jsonbored/safemocker
# or
yarn add -D @jsonbored/safemocker
```

## 🚀 Quick Start (3 Steps - Copy & Paste Ready!)

Follow these exact steps to get `safemocker` working in your project. **Everything is copy-pasteable!**

### Step 1: Create Mock File (One Line!)

Create `__mocks__/next-safe-action.ts` in your **project root** (same level as `package.json`):

```typescript
export * from '@jsonbored/safemocker/jest/mock';
```

**That's it!** Jest automatically uses this file when you import `next-safe-action` in your tests.

### Step 2: Create Your Production `safe-action.ts` File

Create `src/actions/safe-action.ts` (or wherever you keep your actions). **This file works in BOTH test and production** - no modifications needed!

```typescript
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import * as nextSafeActionModule from 'next-safe-action';
import { z } from 'zod';

// Define your metadata schema
const actionMetadataSchema = z.object({
  actionName: z.string().min(1),
  category: z
    .enum(['analytics', 'form', 'content', 'user', 'admin', 'reputation', 'mfa'])
    .optional(),
});

export type ActionMetadata = z.infer<typeof actionMetadataSchema>;

// Create base action client
export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return actionMetadataSchema;
  },
  handleServerError(error) {
    // In production, use your logging library here
    console.error('Server action error:', error);
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
  // Add initial context (userAgent, startTime, etc.)
  const startTime = performance.now();
  // In production: const headersList = await headers();
  // const userAgent = headersList.get('user-agent') || 'unknown';
  const userAgent = 'production-user-agent'; // Replace with real headers() in production

  return next({
    ctx: {
      userAgent,
      startTime,
    },
  });
});

// Create logged action (with error handling)
const loggedAction = actionClient.use(async ({ next, metadata }) => {
  try {
    return await next();
  } catch (error) {
    const actionName = metadata?.actionName ?? 'unknown';
    console.error(`Action ${actionName} failed:`, error);
    throw error;
  }
});

// Create rate limited action (with metadata validation)
const realRateLimitedAction = loggedAction.use(async ({ next, metadata }) => {
  const parsedMetadata = actionMetadataSchema.safeParse(metadata);
  if (!parsedMetadata.success) {
    throw new Error('Invalid action configuration');
  }
  return next();
});

// Extract mocked actions if available (only in tests via safemocker)
// In production, these don't exist in next-safe-action, so we create our own
const mockAuthedAction = 'authedAction' in nextSafeActionModule 
  ? (nextSafeActionModule as any).authedAction 
  : undefined;
const mockOptionalAuthAction = 'optionalAuthAction' in nextSafeActionModule 
  ? (nextSafeActionModule as any).optionalAuthAction 
  : undefined;
const mockRateLimitedAction = 'rateLimitedAction' in nextSafeActionModule 
  ? (nextSafeActionModule as any).rateLimitedAction 
  : undefined;

// Export rateLimitedAction: use mock in tests, real in production
export const rateLimitedAction = mockRateLimitedAction ?? realRateLimitedAction;

// Create production authedAction
const realAuthedAction = realRateLimitedAction.use(async ({ next, metadata }) => {
  // In production, add your real authentication middleware here
  // Example: Check session, validate JWT, get user from database
  const authCtx = {
    userId: 'production-user-id', // Replace with real auth logic
    userEmail: 'user@example.com', // Replace with real auth logic
    authToken: 'production-token', // Replace with real auth logic
  };

  return next({
    ctx: authCtx,
  });
});

// Export authedAction: use mock in tests, real in production
export const authedAction = mockAuthedAction ?? realAuthedAction;

// Create production optionalAuthAction
const realOptionalAuthAction = realRateLimitedAction.use(async ({ next, metadata }) => {
  // In production, add your real optional authentication middleware here
  const authCtx = {
    user: null as { id: string; email: string } | null,
    userId: undefined as string | undefined,
    userEmail: undefined as string | undefined,
    authToken: undefined as string | undefined,
  };

  return next({
    ctx: authCtx,
  });
});

// Export optionalAuthAction: use mock in tests, real in production
export const optionalAuthAction = mockOptionalAuthAction ?? realOptionalAuthAction;
```

**Key Point:** This file uses the **real** `next-safe-action` API. In tests, `next-safe-action` is automatically replaced with the mock from Step 1. In production, it uses the real library. **Zero modifications needed between environments!**

### Step 3: Create Your Actions and Tests

Create `src/actions/my-action.ts`:

```typescript
import { z } from 'zod';
import { authedAction } from './safe-action';

export const createItem = authedAction
  .inputSchema(
    z.object({
      name: z.string().min(1, 'Name is required'),
      description: z.string().min(10, 'Description must be at least 10 characters'),
    })
  )
  .outputSchema(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      authorId: z.string(),
      createdAt: z.string(),
    })
  )
  .metadata({ actionName: 'createItem', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    // Your business logic here
    // In production, this would save to database
    return {
      id: `item-${Date.now()}`,
      name: parsedInput.name,
      description: parsedInput.description,
      authorId: ctx.userId, // From auth middleware
      createdAt: new Date().toISOString(),
    };
  });
```

Create `src/actions/my-action.test.ts` (same directory, inline test):

```typescript
import { describe, expect, it } from '@jest/globals';
import { createItem } from './my-action';
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('createItem', () => {
  it('should create item successfully with valid input', async () => {
    const result = await createItem({
      name: 'My Item',
      description: 'This is a valid description with enough characters.',
    });

    // Use InferSafeActionFnResult for 100% type safety - NO type assertions needed!
    type CreateItemResult = InferSafeActionFnResult<typeof createItem>;
    const typedResult: CreateItemResult = result;

    expect(typedResult.data).toBeDefined();
    expect(typedResult.data?.name).toBe('My Item');
    expect(typedResult.data?.authorId).toBe('test-user-id'); // From safemocker mock
    expect(typedResult.serverError).toBeUndefined();
    expect(typedResult.fieldErrors).toBeUndefined(); // Type-safe access!
  });

  it('should return validation errors for invalid input', async () => {
    const result = await createItem({
      name: '', // Invalid: min length
      description: 'short', // Invalid: min length
    });

    type CreateItemResult = InferSafeActionFnResult<typeof createItem>;
    const typedResult: CreateItemResult = result;

    // fieldErrors is accessible without type assertions - 100% type-safe!
    expect(typedResult.fieldErrors).toBeDefined();
    expect(typedResult.fieldErrors?.name).toBeDefined();
    expect(typedResult.fieldErrors?.description).toBeDefined();
    expect(typedResult.data).toBeUndefined();
    expect(typedResult.serverError).toBeUndefined();
  });
});
```

**That's it!** Run `pnpm test` (or `npm test`) and everything works with 100% type safety.

### How It Works

1. **In Tests:** When you import `next-safe-action`, Jest automatically uses `__mocks__/next-safe-action.ts`, which exports `safemocker`'s mock. Your `safe-action.ts` file uses the mock, so tests run without real auth/database.

2. **In Production:** When you import `next-safe-action`, it uses the real library. Your `safe-action.ts` file creates its own middleware chain, so production works normally.

3. **Zero Configuration:** The same `safe-action.ts` file works in both environments. No modifications needed!

### Complete Working Example

See `src/actions/` in this repository for a complete, working example:
- **`__mocks__/next-safe-action.ts`** (at root) - One-line mock setup
- **`src/actions/safe-action.ts`** - Production setup (works in test & prod)
- **`src/actions/actions.ts`** - Example actions (create, get, update, delete, search)
- **`src/actions/actions.test.ts`** - Complete test suite (100% type-safe, no assertions)

**Copy these files to your project and you're ready to go!** Everything is pre-configured and works out of the box.

## 📚 Detailed Guide

> **Note:** If you're just getting started, follow the [Quick Start](#-quick-start-3-steps---copy--paste-ready) section above. This detailed guide covers advanced customization and alternative setups.

<details>
<summary><strong>Jest Integration (Advanced)</strong></summary>

> **For most users:** Follow the [Quick Start](#-quick-start-3-steps---copy--paste-ready) section above. This section covers advanced customization.

### Basic Setup (Same as Quick Start)

Create `__mocks__/next-safe-action.ts` in your project root:

```typescript
export * from '@jsonbored/safemocker/jest/mock';
```

**That's it!** Zero configuration required. Works out of the box.

<details>
<summary><strong>Want to customize? (Optional)</strong></summary>

If you need custom configuration, use the advanced API from `@jsonbored/safemocker/jest`:

```typescript
import { createCompleteActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

const actionMetadataSchema = z.object({
  actionName: z.string().min(1),
  category: z.enum(['analytics', 'form', 'content', 'user', 'admin']).optional(),
});

const { authedAction, optionalAuthAction, rateLimitedAction } = createCompleteActionClient(
  actionMetadataSchema,
  {
  defaultServerError: 'Something went wrong',
  isProduction: false,
  auth: {
    enabled: true,
      testUserId: 'custom-user-id',
      testUserEmail: 'custom@example.com',
    },
  }
);

export function createSafeActionClient(config?: {
  defineMetadataSchema?: () => z.ZodType;
  handleServerError?: (error: unknown) => string;
}) {
  const { actionClient } = createCompleteActionClient(
    config?.defineMetadataSchema?.() || actionMetadataSchema,
    {
      defaultServerError: 'Something went wrong',
      isProduction: false,
      auth: {
        enabled: true,
        testUserId: 'custom-user-id',
        testUserEmail: 'custom@example.com',
  },
    }
  );
  return actionClient;
}

export const DEFAULT_SERVER_ERROR_MESSAGE = 'Something went wrong';
export { authedAction, optionalAuthAction, rateLimitedAction };
```

</details>

### Step 2: Use in Tests

```typescript
// Your test file
import { authedAction } from './safe-action'; // Your real safe-action.ts file
import { z } from 'zod';
import type { InferSafeActionFnResult } from 'next-safe-action';

// Create action using REAL safe-action.ts (which uses mocked next-safe-action)
const testAction = authedAction
  .inputSchema(z.object({ id: z.string() }))
  .metadata({ actionName: 'testAction', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return { id: parsedInput.id, userId: ctx.userId };
  });

// Test with 100% type safety - NO type assertions needed!
const result = await testAction({ id: '123' });

// Use InferSafeActionFnResult for type-safe access to fieldErrors
type TestActionResult = InferSafeActionFnResult<typeof testAction>;
const typedResult: TestActionResult = result;

expect(typedResult.data).toEqual({ id: '123', userId: 'test-user-id' });
expect(typedResult.serverError).toBeUndefined();
expect(typedResult.fieldErrors).toBeUndefined(); // Type-safe access!
```

**That's it!** Jest automatically uses your mock when you import `next-safe-action`. Your production code works in both test and production environments.

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

This repository includes complete production examples in `src/actions/` demonstrating real-world usage:

<details>
<summary><strong>src/actions/</strong> ⭐ **Complete Real-World Examples**</summary>

**Complete, ready-to-use examples** that demonstrate real production usage:

- **`__mocks__/next-safe-action.ts`** (at root) - One-line mock setup (`export * from '@jsonbored/safemocker/jest/mock'`)
- **`src/actions/safe-action.ts`** - Complete production safe-action.ts (works in test & prod)
- **`src/actions/actions.ts`** - Example production actions (create, get, update, delete, search)
- **`src/actions/actions.test.ts`** - Complete test suite (100% type-safe, no assertions needed)
- **`src/actions/safe-action.test.ts`** - Tests for safe-action.ts

**This is the BEST starting point!** These files demonstrate exactly how to use `safemocker` in a real codebase. Everything is pre-configured and works out of the box.

</details>

<details>
<summary><strong>src/actions/ - Real Production Code**</summary>

**Real production examples** demonstrating complete usage patterns:

- **`src/actions/safe-action.ts`** - Complete production `safe-action.ts` that works in both test and production
  - Base action client creation
  - Metadata schema definition
  - Error handling configuration
  - Middleware chaining (logging, rate limiting, authentication)
  - Conditional mock usage (tests) vs real middleware (production)
  - **Test Coverage:** Tested indirectly through `actions.test.ts` (the real test is whether actions work)

- **`src/actions/actions.ts`** - Complete production actions demonstrating real-world patterns:
  - **`createPost`** - Authentication required, input/output validation, context injection
  - **`getPost`** - Optional authentication, public/private post handling
  - **`updatePost`** - Authentication + authorization (ownership check)
  - **`deletePost`** - Authentication + authorization (ownership check)
  - **`searchPosts`** - Rate limiting, query validation
  - **Test Coverage:** `src/actions/actions.test.ts` and `__tests__/production-example.test.ts` - Complete test suites demonstrating:
    - 100% type safety with `InferSafeActionFnResult`
    - No type assertions needed
    - Real production code tested without modifications
    - Validation error testing
    - Authorization testing

**Key Features:**
- Uses REAL `next-safe-action` API (no modifications needed)
- Works in both test and production environments
- Demonstrates real-world patterns (auth, authorization, validation)
- Includes output schema validation
- All tests pass with 100% type safety

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

`safemocker` maintains **100% type safety** without any type assertions:

- ✅ Input schemas are type-checked
- ✅ Handler parameters are typed (`parsedInput`, `ctx`)
- ✅ Return types are inferred correctly
- ✅ `SafeActionResult` includes `fieldErrors` (type-safe access)

**Using `InferSafeActionFnResult` for Type Safety:**

The mock exports the same utility types as next-safe-action, including `InferSafeActionFnResult`. Use this in your test files to get the correct type with `fieldErrors`:

```typescript
import type { InferSafeActionFnResult } from 'next-safe-action';
import { myAction } from './actions';

// Get the correct type with fieldErrors - no type assertions needed!
type MyActionResult = InferSafeActionFnResult<typeof myAction>;
const result: MyActionResult = await myAction({ ... });

// fieldErrors is accessible without any type assertions
expect(result.fieldErrors).toBeDefined();
expect(result.fieldErrors?.email).toBeDefined();
```

**How It Works:**

1. In tests, `next-safe-action` is replaced with the mock via Jest
2. The mock exports `InferSafeActionFnResult` which uses safemocker's `SafeActionResult` (includes `fieldErrors`)
3. When you use `InferSafeActionFnResult<typeof myAction>`, TypeScript extracts the return type
4. Since the mock's action functions return `Promise<SafeActionResult<TOutput>>`, the extracted type includes `fieldErrors`
5. **No type assertions needed** - it's 100% type-safe!

**Production Usage:**

In production, use `InferSafeActionFnResult` from the real `next-safe-action` package. The types work the same way, ensuring consistency between test and production code.

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
