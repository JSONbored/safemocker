/**
 * Error Handling Example
 *
 * This example demonstrates how safemocker handles different types of errors:
 * validation errors, server errors, and custom error messages.
 *
 * **Framework Support:**
 * - **Jest**: Import from `@jsonbored/safemocker/jest`
 * - **Vitest**: Import from `@jsonbored/safemocker/vitest`
 *
 * Jest:
 * ```typescript
 * import {
 *   createAuthedActionClient,
 *   createMockSafeActionClient,
 * } from '@jsonbored/safemocker/jest';
 * ```
 *
 * Vitest:
 * ```typescript
 * import {
 *   createAuthedActionClient,
 *   createMockSafeActionClient,
 * } from '@jsonbored/safemocker/vitest';
 * ```
 *
 * All other code remains identical between Jest and Vitest.
 *
 * @example
 * ```bash
 * # Run this example
 * npx tsx examples/error-handling.example.ts
 * ```
 */

import {
  createAuthedActionClient,
  createMockSafeActionClient,
} from '@jsonbored/safemocker/jest';
import { z } from 'zod';
import type { InferSafeActionFnResult } from 'next-safe-action';

// Example 1: Development mode (shows detailed errors)
const devClient = createAuthedActionClient({
  defaultServerError: 'Something went wrong',
  isProduction: false, // Shows actual error messages
});

const deleteItemDev = devClient
  .inputSchema(z.object({ id: z.string().min(1, 'ID is required') }))
  .metadata({ actionName: 'deleteItem', category: 'content' })
  .action(async ({ parsedInput }) => {
    if (parsedInput.id === 'not-found') {
      throw new Error('Item not found');
    }
    if (parsedInput.id === 'unauthorized') {
      throw new Error('You do not have permission to delete this item');
    }
    return { success: true, message: 'Item deleted' };
  });

// Example 2: Production mode (hides error details)
const prodClient = createAuthedActionClient({
  defaultServerError: 'Something went wrong',
  isProduction: true, // Hides error details
});

const deleteItemProd = prodClient
  .inputSchema(z.object({ id: z.string().min(1, 'ID is required') }))
  .metadata({ actionName: 'deleteItem', category: 'content' })
  .action(async ({ parsedInput }) => {
    if (parsedInput.id === 'not-found') {
      throw new Error('Item not found');
    }
    return { success: true, message: 'Item deleted' };
  });

// Example 3: Custom error handling
const customClient = createMockSafeActionClient({
  defaultServerError: 'Custom error message',
  isProduction: false,
});

const processPayment = customClient
  .inputSchema(
    z.object({
      amount: z.number().positive(),
      currency: z.string().length(3),
    })
  )
  .action(async ({ parsedInput }) => {
    if (parsedInput.amount > 1000) {
      throw new Error('Amount exceeds maximum limit');
    }
    if (parsedInput.currency !== 'USD') {
      throw new Error('Only USD currency is supported');
    }
    return {
      transactionId: `txn-${Date.now()}`,
      amount: parsedInput.amount,
      currency: parsedInput.currency,
    };
  });

// Example usage
async function main() {
  console.log('=== Error Handling Example ===\n');

  // Test 1: Validation errors
  console.log('Test 1: Validation errors');
  const result1 = await deleteItemDev({
    id: '', // Invalid: empty string
  });

  type DeleteItemResult = InferSafeActionFnResult<typeof deleteItemDev>;
  const typedResult1: DeleteItemResult = result1;

  if (typedResult1.fieldErrors) {
    console.log('✅ Validation errors caught:');
    console.log('   - ID errors:', typedResult1.fieldErrors.id);
  }

  // Test 2: Server error in development mode
  console.log('\nTest 2: Server error in development mode (detailed)');
  const result2 = await deleteItemDev({
    id: 'not-found',
  });

  const typedResult2: DeleteItemResult = result2;
  if (typedResult2.serverError) {
    console.log('✅ Server error (detailed):', typedResult2.serverError);
  }

  // Test 3: Server error in production mode
  console.log('\nTest 3: Server error in production mode (generic)');
  const result3 = await deleteItemProd({
    id: 'not-found',
  });

  type DeleteItemProdResult = InferSafeActionFnResult<typeof deleteItemProd>;
  const typedResult3: DeleteItemProdResult = result3;

  if (typedResult3.serverError) {
    console.log('✅ Server error (generic):', typedResult3.serverError);
    console.log('   (Error details are hidden in production mode)');
  }

  // Test 4: Custom error handling
  console.log('\nTest 4: Custom error handling');
  const result4 = await processPayment({
    amount: 2000, // Exceeds limit
    currency: 'USD',
  });

  type ProcessPaymentResult = InferSafeActionFnResult<typeof processPayment>;
  const typedResult4: ProcessPaymentResult = result4;

  if (typedResult4.serverError) {
    console.log('✅ Custom error caught:', typedResult4.serverError);
  }

  // Test 5: Success case
  console.log('\nTest 5: Success case');
  const result5 = await processPayment({
    amount: 100,
    currency: 'USD',
  });

  const typedResult5: ProcessPaymentResult = result5;
  if (typedResult5.data) {
    console.log('✅ Payment processed successfully:', typedResult5.data);
  }

  console.log('\n=== Example Complete ===');
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { deleteItemDev, deleteItemProd, processPayment };

