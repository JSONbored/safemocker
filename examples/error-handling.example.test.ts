/**
 * Tests for error-handling.example.ts
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
import { deleteItemDev, deleteItemProd, processPayment } from './error-handling.example';
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('error-handling.example', () => {
  describe('deleteItemDev', () => {
    it('should return validation errors for invalid input', async () => {
      const result = await deleteItemDev({ id: '' });

      type DeleteItemResult = InferSafeActionFnResult<typeof deleteItemDev>;
      const typedResult: DeleteItemResult = result;

      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.id).toBeDefined();
    });

    it('should return detailed error in development mode', async () => {
      const result = await deleteItemDev({ id: 'not-found' });

      type DeleteItemResult = InferSafeActionFnResult<typeof deleteItemDev>;
      const typedResult: DeleteItemResult = result;

      expect(typedResult.serverError).toBe('Item not found');
    });
  });

  describe('deleteItemProd', () => {
    it('should return generic error in production mode', async () => {
      const result = await deleteItemProd({ id: 'not-found' });

      type DeleteItemProdResult = InferSafeActionFnResult<typeof deleteItemProd>;
      const typedResult: DeleteItemProdResult = result;

      expect(typedResult.serverError).toBe('Something went wrong');
    });
  });

  describe('processPayment', () => {
    it('should return error for amount exceeding limit', async () => {
      const result = await processPayment({
        amount: 2000,
        currency: 'USD',
      });

      type ProcessPaymentResult = InferSafeActionFnResult<typeof processPayment>;
      const typedResult: ProcessPaymentResult = result;

      expect(typedResult.serverError).toBe('Amount exceeds maximum limit');
    });

    it('should process payment successfully', async () => {
      const result = await processPayment({
        amount: 100,
        currency: 'USD',
      });

      type ProcessPaymentResult = InferSafeActionFnResult<typeof processPayment>;
      const typedResult: ProcessPaymentResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.transactionId).toBeDefined();
      expect(typedResult.data?.amount).toBe(100);
    });
  });
});

