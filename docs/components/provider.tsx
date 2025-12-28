'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import SearchDialog from '@/components/search';
import type { ReactNode } from 'react';

interface ProviderProps {
  children: ReactNode;
}

/**
 * Provider - Client component wrapper for RootProvider with custom SearchDialog
 * 
 * This is needed because RootProvider requires client-side components
 * and the layout is a server component.
 */
export function Provider({ children }: ProviderProps) {
  return (
    <RootProvider
      search={{
        SearchDialog,
      }}
    >
      {children}
    </RootProvider>
  );
}

