'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Check, ExternalLink, ChevronDown, Github, Sparkles } from 'lucide-react';
import { Button } from '@/components/button';

interface LLMCopyButtonProps {
  markdownUrl: string;
}

/**
 * LLMCopyButton - Fetches and copies the actual markdown content to clipboard
 */
export function LLMCopyButton({ markdownUrl }: LLMCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async () => {
    try {
      setIsLoading(true);
      
      // Fetch the actual markdown content from the .mdx route
      const fullUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}${markdownUrl}`
        : markdownUrl;
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.statusText}`);
      }
      
      const markdownContent = await response.text();
      
      // Copy the actual markdown content to clipboard
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy markdown:', error);
      // Fallback: try to copy URL if markdown fetch fails
      try {
        const fullUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}${markdownUrl}`
          : markdownUrl;
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Failed to copy URL as fallback:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={isLoading}
      className="gap-2"
      aria-label={copied ? 'Copied!' : isLoading ? 'Loading markdown...' : 'Copy markdown content'}
    >
      {isLoading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          Loading...
        </>
      ) : copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy Markdown
        </>
      )}
    </Button>
  );
}

interface ViewOptionsProps {
  markdownUrl: string;
  githubUrl?: string;
}

/**
 * ViewOptions - Dropdown menu with links to view content in various AI services
 */
export function ViewOptions({ markdownUrl, githubUrl }: ViewOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://safemocker.zeronode.sh';
  
  const fullMarkdownUrl = `${baseUrl}${markdownUrl}`;
  
  const services = [
    {
      name: 'Open in GitHub',
      url: githubUrl || `https://github.com/JSONbored/safemocker`,
      icon: Github,
    },
    {
      name: 'Open in Scira AI',
      url: `https://scira.ai/chat?url=${encodeURIComponent(fullMarkdownUrl)}`,
      icon: Sparkles,
    },
    {
      name: 'Open in ChatGPT',
      url: `https://chatgpt.com/?q=${encodeURIComponent(fullMarkdownUrl)}`,
      icon: ExternalLink,
    },
    {
      name: 'Open in Claude',
      url: `https://claude.ai/chat?url=${encodeURIComponent(fullMarkdownUrl)}`,
      icon: ExternalLink,
    },
    {
      name: 'Open in T3 Chat',
      url: `https://t3.gg/chat?url=${encodeURIComponent(fullMarkdownUrl)}`,
      icon: ExternalLink,
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
        aria-label="View options"
        aria-expanded={isOpen}
      >
        Open
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </Button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-popover text-popover-foreground shadow-lg z-50 backdrop-blur-sm">
          <div className="p-1 bg-popover/95">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <a
                  key={service.name}
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {service.name}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

