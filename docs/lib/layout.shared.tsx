import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { GithubIcon, PackageIcon } from 'lucide-react';
import { GithubInfo } from 'fumadocs-ui/components/github-info';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'safemocker',
      url: '/',
    },
    links: [
      {
        type: 'custom',
        children: (
          <GithubInfo
            owner="JSONbored"
            repo="safemocker"
            className="lg:-mx-2"
          />
        ),
      },
      {
        type: 'icon',
        label: 'View on npm',
        icon: <PackageIcon className="h-4 w-4" />,
        text: 'npm',
        url: 'https://www.npmjs.com/package/@jsonbored/safemocker',
        active: 'none',
      },
    ],
    githubUrl: 'https://github.com/JSONbored/safemocker',
  };
}
