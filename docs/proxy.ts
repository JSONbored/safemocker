/**
 * Next.js proxy file for the docs app
 * 
 * This file exists to prevent Next.js from scanning parent directories
 * and finding ../src/middleware.ts (which is not a Next.js middleware).
 * 
 * This proxy does nothing - it's just a placeholder.
 * 
 * Note: In Next.js 16, middleware.ts was renamed to proxy.ts to better
 * reflect its purpose and clarify the network boundary.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // No-op proxy - just pass through
  return NextResponse.next();
}

