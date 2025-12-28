import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { NextRequest } from 'next/server';

/**
 * PDF Export Route
 * 
 * Exports a documentation page as PDF.
 * This is a basic implementation - in production, you'd want to use
 * a proper PDF generation library like puppeteer or @react-pdf/renderer.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');

  if (!slug) {
    return new Response('Missing slug parameter', { status: 400 });
  }

  // Ensure slug is a string before splitting
  const slugArray = typeof slug === 'string' ? slug.split('/').filter(Boolean) : [];
  const page = slugArray.length > 0 ? source.getPage(slugArray) : null;
  if (!page) {
    notFound();
  }

  // Ensure title and description are strings for HTML interpolation
  const pageTitle = typeof page.data.title === 'string' 
    ? page.data.title 
    : String(page.data.title || '');
  const pageDescription = typeof page.data.description === 'string'
    ? page.data.description
    : String(page.data.description || '');

  // For now, return a simple HTML representation
  // In production, you'd use puppeteer to generate a proper PDF
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${pageTitle} - safemocker</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          h2 { color: #555; margin-top: 2em; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
          pre { background: #f5f5f5; padding: 1em; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>${pageTitle}</h1>
        ${pageDescription ? `<p>${pageDescription}</p>` : ''}
        <div>${await page.data.getText('processed')}</div>
      </body>
    </html>
  `;

  // Note: This is a simplified implementation
  // For actual PDF generation, you would:
  // 1. Use puppeteer to render the HTML and convert to PDF
  // 2. Or use @react-pdf/renderer to create a PDF from React components
  // 3. Return the PDF with proper Content-Type headers

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="${pageTitle}.html"`,
    },
  });
}

