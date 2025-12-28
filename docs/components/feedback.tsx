'use client';

import { useState } from 'react';
import { Button } from '@/components/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackProps {
  pagePath?: string;
  pageTitle?: string;
}

/**
 * Feedback component for documentation pages.
 * Allows users to provide feedback on whether a page was helpful.
 */
export function Feedback({ pagePath, pageTitle }: FeedbackProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (type: 'positive' | 'negative') => {
    if (submitted) return;

    setFeedback(type);
    setSubmitted(true);

    try {
      // Log for debugging (can be removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Feedback submitted:', {
          type,
          pagePath,
          pageTitle,
          timestamp: new Date().toISOString(),
        });
      }

      // Send to feedback API endpoint (which can create GitHub issues)
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, pagePath, pageTitle }),
        });
      } catch (apiError) {
        // Silently fail - API call is optional
        console.error('Failed to send feedback to API:', apiError);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (submitted) {
    return (
      <div className="mt-8 pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          Thank you for your feedback!{' '}
          <a
            href={`https://github.com/JSONbored/safemocker/issues/new?title=Documentation feedback: ${encodeURIComponent(pageTitle || '')}&body=Page: ${encodeURIComponent(pagePath || '')}%0A%0AFeedback: ${feedback === 'positive' ? 'Helpful' : 'Not helpful'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Open an issue on GitHub
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-8 border-t">
      <p className="text-sm font-medium mb-3">Was this page helpful?</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback('positive')}
          className="gap-2"
          aria-label="Yes, this page was helpful"
          aria-pressed={feedback === 'positive'}
        >
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
          Yes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback('negative')}
          className="gap-2"
          aria-label="No, this page was not helpful"
          aria-pressed={feedback === 'negative'}
        >
          <ThumbsDown className="h-4 w-4" aria-hidden="true" />
          No
        </Button>
      </div>
    </div>
  );
}

