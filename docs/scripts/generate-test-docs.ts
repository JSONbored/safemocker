import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, resolve, basename, dirname } from 'node:path';
import { Project } from 'ts-morph';

interface TestInfo {
  file: string;
  describe: string;
  tests: Array<{
    name: string;
    code: string;
    description?: string;
  }>;
}

/**
 * Extract test information from Jest/Vitest test files.
 */
async function extractTestInfo(filePath: string): Promise<TestInfo | null> {
  try {
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(filePath);
    
    const testInfo: TestInfo = {
      file: basename(filePath),
      describe: '',
      tests: [],
    };
    
    // Find describe blocks
    const describeBlocks = sourceFile.getDescendantsOfKind(
      sourceFile.getLanguageVersion() >= 200 /* TypeScript 2.0 */
        ? 259 // SyntaxKind.CallExpression
        : 0
    );
    
    // Simple regex-based extraction as fallback
    const content = readFileSync(filePath, 'utf-8');
    
    // Extract describe block name
    const describeMatch = content.match(/describe\(['"]([^'"]+)['"]/);
    if (describeMatch) {
      testInfo.describe = describeMatch[1];
    }
    
    // Extract test/it blocks
    const testMatches = content.matchAll(/(?:it|test)\(['"]([^'"]+)['"]/g);
    for (const match of testMatches) {
      testInfo.tests.push({
        name: match[1],
        code: '', // Would need more sophisticated parsing for full code
      });
    }
    
    return testInfo.tests.length > 0 ? testInfo : null;
  } catch (error) {
    console.warn(`Failed to parse test file ${filePath}:`, error);
    return null;
  }
}

/**
 * Scan for test files in the project.
 */
async function findTestFiles(dir: string): Promise<string[]> {
  const testFiles: string[] = [];
  const items = await readdir(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stats = await stat(fullPath);
    
    if (stats.isDirectory()) {
      // Skip node_modules and .next
      const itemStr = typeof item === 'string' ? item : String(item || '');
      if (itemStr === 'node_modules' || itemStr === '.next' || (typeof itemStr === 'string' && itemStr.startsWith('.'))) {
        continue;
      }
      const subFiles = await findTestFiles(fullPath);
      testFiles.push(...subFiles);
    } else if (
      item.endsWith('.test.ts') ||
      item.endsWith('.test.tsx') ||
      item.endsWith('.spec.ts') ||
      item.endsWith('.spec.tsx')
    ) {
      testFiles.push(fullPath);
    }
  }
  
  return testFiles;
}

/**
 * Generate MDX content for test examples page.
 */
function generateTestExamplesMDX(testInfos: TestInfo[]): string {
  const jestTests = testInfos.filter((info) =>
    info.file.includes('jest') || !info.file.includes('vitest')
  );
  const vitestTests = testInfos.filter((info) => info.file.includes('vitest'));
  
  return `---
title: Test Examples
description: Comprehensive test examples showing Jest and Vitest usage with safemocker
---

import { GraphView } from '@/components/graph-view';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import { Files, File, Folder } from 'fumadocs-ui/components/files';

## Overview

This page showcases all test examples in the safemocker project, demonstrating how to use safemocker with both Jest and Vitest.

## Test File Relationships

<GraphView />

## Test Files Structure

<Files>
${generateFileStructure(testInfos)}
</Files>

## Test Examples

<Tabs items={['Jest', 'Vitest']} groupId="test-framework" persist>
  <Tab value="Jest">
    ${generateTestExamplesContent(jestTests, 'Jest')}
  </Tab>
  <Tab value="Vitest">
    ${generateTestExamplesContent(vitestTests, 'Vitest')}
  </Tab>
</Tabs>
`;
}

function generateFileStructure(testInfos: TestInfo[]): string {
  const structure: Record<string, string[]> = {};
  
  for (const info of testInfos) {
    const dir = dirname(info.file);
    if (!structure[dir]) {
      structure[dir] = [];
    }
    structure[dir].push(info.file);
  }
  
  let result = '';
  for (const [dir, files] of Object.entries(structure)) {
    if (dir !== '.') {
      result += `  <Folder name="${dir}">\n`;
    }
    for (const file of files) {
      result += `    <File name="${file}" />\n`;
    }
    if (dir !== '.') {
      result += `  </Folder>\n`;
    }
  }
  
  return result;
}

function generateTestExamplesContent(testInfos: TestInfo[], framework: string): string {
  if (testInfos.length === 0) {
    return `\n### No ${framework} tests found\n\nAdd ${framework} test files to see examples here.\n`;
  }
  
  return testInfos
    .map(
      (info) => `### ${info.describe || info.file}

${info.tests.map((test) => `- **${test.name}**`).join('\n')}

\`\`\`typescript
// ${info.file}
// See full implementation in the test file
\`\`\`
`
    )
    .join('\n');
}

/**
 * Main function to generate test documentation.
 */
async function main() {
  const projectRoot = resolve(process.cwd(), '..');
  const testFiles = await findTestFiles(projectRoot);
  
  console.log(`Found ${testFiles.length} test files.`);
  
  const testInfos: TestInfo[] = [];
  for (const file of testFiles) {
    const info = await extractTestInfo(file);
    if (info) {
      testInfos.push(info);
    }
  }
  
  if (testInfos.length === 0) {
    console.log('No test information extracted.');
    return;
  }
  
  const mdxContent = generateTestExamplesMDX(testInfos);
  const outputPath = resolve(process.cwd(), 'content/docs/examples/test-examples.mdx');
  
  writeFileSync(outputPath, mdxContent);
  console.log(`Test examples page written to ${outputPath}`);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { extractTestInfo, findTestFiles, generateTestExamplesMDX };

