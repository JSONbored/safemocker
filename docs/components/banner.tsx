'use client';

import { Banner as FumadocsBanner } from 'fumadocs-ui/components/banner';
import type { ComponentProps } from 'react';

/**
 * Banner component for displaying announcements.
 * 
 * Supports dismissible banners with localStorage persistence.
 * Use for important updates or announcements.
 * 
 * @example
 * ```tsx
 * <Banner id="announcement-1">
 *   New version 0.3.0 is now available!
 * </Banner>
 * ```
 */
export function Banner({ 
  id, 
  children, 
  variant,
  ...props 
}: { 
  id?: string; 
  children: React.ReactNode;
  variant?: ComponentProps<typeof FumadocsBanner>['variant'];
  changeLayout?: boolean;
}) {
  return (
    <FumadocsBanner id={id} variant={variant} {...props}>
      {children}
    </FumadocsBanner>
  );
}

