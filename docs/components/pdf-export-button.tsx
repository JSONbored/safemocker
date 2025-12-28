'use client';

import { Button } from '@/components/button';
import { FileDown } from 'lucide-react';

interface PDFExportButtonProps {
  slug: string;
  title: string;
}

/**
 * PDF Export Button Component
 * 
 * Provides a button to export the current documentation page as PDF.
 * Opens the PDF export route in a new window.
 */
export function PDFExportButton({ slug, title }: PDFExportButtonProps) {
  const handleExport = () => {
    const url = `/api/export-pdf?slug=${encodeURIComponent(slug)}`;
    window.open(url, '_blank');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="gap-2"
      aria-label={`Export ${title} as PDF`}
    >
      <FileDown className="h-4 w-4" aria-hidden="true" />
      Export PDF
    </Button>
  );
}

