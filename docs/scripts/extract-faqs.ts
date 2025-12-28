import { readFileSync, writeFileSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import matter from 'gray-matter';

interface FAQItem {
  question: string;
  answer: string;
  page: string;
  url: string;
}

/**
 * Extract FAQ items from MDX frontmatter.
 * 
 * FAQ items can be defined in frontmatter as:
 * ```yaml
 * faqs:
 *   - question: "What is this?"
 *     answer: "This is an answer."
 * ```
 */
function extractFAQsFromFrontmatter(
  filePath: string,
  content: string
): FAQItem[] {
  try {
    const { data } = matter(content);
    const faqs = data.faqs || [];
    
    if (!Array.isArray(faqs) || faqs.length === 0) {
      return [];
    }
    
    // Get page URL from file path
    const relativePath = filePath.replace(resolve(process.cwd(), 'content/docs'), '');
    const url = `/docs${relativePath.replace(/\.mdx?$/, '')}`;
    
    return faqs.map((faq: { question: string; answer: string }) => ({
      question: faq.question,
      answer: faq.answer,
      page: data.title || relativePath,
      url,
    }));
  } catch (error) {
    console.warn(`Failed to parse frontmatter in ${filePath}:`, error);
    return [];
  }
}

/**
 * Recursively scan directory for MDX files and extract FAQs.
 */
async function scanDirectory(dir: string): Promise<FAQItem[]> {
  const items = await readdir(dir);
  const faqs: FAQItem[] = [];
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stats = await stat(fullPath);
    
    if (stats.isDirectory()) {
      const subFAQs = await scanDirectory(fullPath);
      faqs.push(...subFAQs);
    } else if (item.endsWith('.mdx') || item.endsWith('.md')) {
      const content = readFileSync(fullPath, 'utf-8');
      const pageFAQs = extractFAQsFromFrontmatter(fullPath, content);
      faqs.push(...pageFAQs);
    }
  }
  
  return faqs;
}

/**
 * Generate FAQ structured data JSON.
 */
function generateFAQStructuredData(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Main function to extract FAQs and generate structured data.
 */
async function main() {
  const contentDir = resolve(process.cwd(), 'content/docs');
  const outputPath = resolve(process.cwd(), 'lib/faqs.json');
  
  console.log('Scanning for FAQs...');
  const faqs = await scanDirectory(contentDir);
  
  if (faqs.length === 0) {
    console.log('No FAQs found in documentation.');
    return;
  }
  
  console.log(`Found ${faqs.length} FAQ items.`);
  
  // Generate structured data
  const structuredData = generateFAQStructuredData(faqs);
  
  // Write to file
  writeFileSync(outputPath, JSON.stringify(structuredData, null, 2));
  console.log(`FAQ structured data written to ${outputPath}`);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { extractFAQsFromFrontmatter, scanDirectory, generateFAQStructuredData };

