import Link from 'next/link';
import { Cards, Card } from 'fumadocs-ui/components/card';
import { Button } from '@/components/button';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 flex-1 py-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">safemocker</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Type-safe, Jest & Vitest-compatible mock for next-safe-action. Replicates real middleware behavior and returns proper SafeActionResult structure.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/docs/getting-started/quick-start">Get Started</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="https://github.com/JSONbored/safemocker" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
        <Cards>
          <Card title="Quick Start" href="/docs/getting-started/quick-start" description="Get up and running in 3 simple steps" />
          <Card title="Installation" href="/docs/getting-started/installation" description="Install safemocker in your project" />
          <Card title="API Reference" href="/docs/api-reference" description="Complete API documentation" />
          <Card title="Examples" href="/docs/examples" description="Real-world usage examples" />
        </Cards>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="https://github.com/JSONbored/safemocker" className="font-medium underline">
            View on GitHub
          </Link>
          {' · '}
          <Link href="https://www.npmjs.com/package/@jsonbored/safemocker" className="font-medium underline">
            View on npm
          </Link>
        </p>
      </div>
    </div>
  );
}
