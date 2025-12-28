'use client';

import { useState } from 'react';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { Button } from '@/components/button';
import { PlayIcon, CopyIcon, CheckIcon } from 'lucide-react';

interface CodePlaygroundProps {
  defaultCode?: string;
  defaultLanguage?: 'typescript' | 'javascript';
  onExecute?: (code: string) => Promise<string | { error: string }>;
}

/**
 * Interactive code playground component for documentation.
 * Allows users to edit and execute code examples in the browser.
 */
export function CodePlayground({
  defaultCode = '',
  defaultLanguage = 'typescript',
  onExecute,
}: CodePlaygroundProps) {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState<'typescript' | 'javascript'>(defaultLanguage);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExecute = async () => {
    if (!onExecute) {
      setError('Code execution is not available in this example');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      const executionResult = await onExecute(code);
      if (typeof executionResult === 'string') {
        setResult(executionResult);
      } else {
        setError(executionResult.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="my-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <Button
            variant={language === 'typescript' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('typescript')}
          >
            TypeScript
          </Button>
          <Button
            variant={language === 'javascript' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('javascript')}
          >
            JavaScript
          </Button>
        </div>
        <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            {onExecute && (
              <Button
                variant="default"
                size="sm"
                onClick={handleExecute}
                disabled={isExecuting}
                className="gap-2"
              >
                <PlayIcon className="h-4 w-4" />
                {isExecuting ? 'Running...' : 'Run'}
              </Button>
            )}
          </div>
        </div>

      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full min-h-[200px] font-mono text-sm p-4 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter your code here..."
        />
      </div>

      {result && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Output:</p>
          <pre className="text-sm overflow-x-auto">{result}</pre>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm font-medium text-destructive mb-2">Error:</p>
          <pre className="text-sm text-destructive overflow-x-auto">{error}</pre>
        </div>
      )}
    </div>
  );
}

