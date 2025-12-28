import { NextRequest, NextResponse } from 'next/server';

/**
 * Feedback API Route
 * 
 * Handles feedback submissions and optionally creates GitHub issues.
 * 
 * To enable GitHub integration:
 * 1. Set GITHUB_TOKEN environment variable
 * 2. Set GITHUB_REPO environment variable (e.g., "JSONbored/safemocker")
 * 3. Uncomment the GitHub API integration code below
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, pagePath, pageTitle } = body;

    if (!type || !pagePath || !pageTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log feedback (in production, you might want to store this in a database)
    console.log('Feedback received:', { type, pagePath, pageTitle });

    // Optional: Create GitHub issue
    // Uncomment below to enable GitHub Issues integration
    /*
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || 'JSONbored/safemocker';

    if (githubToken) {
      const issueTitle = `Documentation feedback: ${pageTitle}`;
      const issueBody = `**Page:** ${pagePath}\n\n**Feedback:** ${type === 'positive' ? 'Helpful' : 'Not helpful'}\n\n**Timestamp:** ${new Date().toISOString()}`;

      const response = await fetch(`https://api.github.com/repos/${githubRepo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: ['documentation', 'feedback', type === 'positive' ? 'positive' : 'needs-improvement'],
        }),
      });

      if (!response.ok) {
        console.error('Failed to create GitHub issue:', await response.text());
      }
    }
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

