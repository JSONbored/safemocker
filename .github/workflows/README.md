# GitHub Actions Workflows Documentation

## Overview

This repository uses automated workflows for CI/CD, version bumping, changelog generation, and npm publishing. All workflows are designed to work seamlessly with git-cliff for automated changelog and version management.

## Workflows

### 1. CI (`ci.yml`)

**Purpose:** Runs tests, builds, and type-checking on every PR and push to main.

**Triggers:**
- Pull requests to `main`
- Pushes to `main`

**Jobs:**
- `test`: Runs build, tests, and coverage

**Note:** Changelog updates are NOT handled here - they only happen during releases.

---

### 2. Version Bump & Changelog (`version-bump.yml`)

**Purpose:** Automatically bumps version, generates changelog, and creates release tag.

**Triggers:**
- PR merge to `main` (automatic)
- Manual `workflow_dispatch` (with optional bump type override)

**What it does:**
1. Fetches all tags and finds the last version tag
2. Counts commits since last tag
3. Calculates new version using `git-cliff --bumped-version` (auto-detects from commits)
4. Generates versioned changelog using `git-cliff --tag vX.Y.Z --latest --unreleased`
5. Updates `package.json` with new version
6. Commits changes and creates/pushes tag
7. Tag push automatically triggers `publish-release.yml`

**Manual Trigger Options:**
- `bump_type`: Choose `auto` (default), `major`, `minor`, or `patch`
  - `auto`: git-cliff analyzes commits and determines bump type
  - `major`/`minor`/`patch`: Force a specific bump type

**Key Features:**
- Uses git-cliff's native version calculation (no custom scripts)
- Generates versioned changelog directly (no manual sed replacements)
- Handles edge cases (no commits, same version, etc.)
- Comprehensive debugging and logging

---

### 3. Publish Release (`publish-release.yml`)

**Purpose:** Publishes npm package and creates GitHub Release when a version tag is pushed.

**Triggers:**
- Tag push matching `v*.*.*` pattern (automatic, triggered by `version-bump.yml`)
- Manual `workflow_dispatch` (with tag input for re-publishing)

**What it does:**
1. Extracts version from tag
2. Verifies `package.json` version matches tag
3. Builds project
4. Runs tests
5. Publishes to npm (using trusted publishing/OIDC)
6. Extracts changelog section for the version
7. Creates GitHub Release with changelog as release notes

**Environment:**
- Uses `production` environment (required for npm trusted publishing)

---

## Workflow Flow

```
┌─────────────────────────────────────┐
│  PR Merge / Push to Main            │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  version-bump.yml                   │
│  - Calculate version                │
│  - Generate changelog               │
│  - Update package.json              │
│  - Commit & create tag              │
└─────────────────────────────────────┘
              │
              ▼ (tag push)
┌─────────────────────────────────────┐
│  publish-release.yml                │
│  - Build & test                     │
│  - Publish to npm                   │
│  - Create GitHub Release            │
└─────────────────────────────────────┘
```

## Version Bumping Rules

Version bumping is handled automatically by git-cliff based on conventional commits:

- **Major** (`1.0.0` → `2.0.0`): Breaking changes (`feat!:`, `BREAKING CHANGE:`)
- **Minor** (`1.0.0` → `1.1.0`): New features (`feat:`)
- **Patch** (`1.0.0` → `1.0.1`): Bug fixes (`fix:`), refactors, performance, style

**Ignored commits** (no version bump):
- `chore:`, `docs:`, `test:`, `ci:`, `build:`

## Changelog Generation

Changelogs are generated using git-cliff with the following approach:

1. **During Release:** Uses `git-cliff --tag vX.Y.Z --latest --unreleased` to generate a versioned changelog entry directly
2. **No Manual Manipulation:** git-cliff handles all formatting, no sed replacements needed
3. **Format:** Follows [Keep a Changelog](https://keepachangelog.com/) format
4. **Grouping:** Commits are grouped by type (Added, Fixed, Changed, etc.)

### GitHub Integration Features

When `GITHUB_TOKEN` is provided, git-cliff enhances changelogs with:

- **PR Links**: Automatic links to pull requests in commit messages
  - Format: `- commit message by @username in [#123](url)`
  - Works with squash merges and regular merges

- **Contributor Attribution**: Shows who made each change
  - Format: `by @username` after each commit message
  - Retrieved from GitHub API

- **First-Time Contributors**: Special recognition section
  - Shows new contributors separately: `### New Contributors`
  - Format: `- @username made their first contribution in [#123](url)`

- **Statistics**: Release metrics automatically calculated
  - Commit count (total and conventional)
  - Linked issues/PRs count
  - Days since last release

- **PR Labels**: Can be used for filtering
  - Add `skip-release-notes` label to exclude commits from changelog
  - Supports label-based grouping (advanced feature)

**Example changelog entry with GitHub integration:**

```markdown
## [0.2.0] - 2025-12-27

### Added
- feat: add search functionality by @username in [#42](https://github.com/JSONbored/safemocker/pull/42)
- feat: improve performance by @contributor in [#43](https://github.com/JSONbored/safemocker/pull/43)

### New Contributors
- @newuser made their first contribution in [#42](https://github.com/JSONbored/safemocker/pull/42)

### Statistics
- 5 commits in this release
- 4 conventional commits
- 2 linked issues/PRs
- 3 days since last release
```

**Configuration:**

- `GITHUB_TOKEN` is automatically provided in workflows via `secrets.GITHUB_TOKEN`
- `[remote.github]` section in `cliff.toml` configures repository details
- GitHub API is used to fetch PR metadata, contributor info, and labels

## Manual Operations

### Trigger Version Bump Manually

1. Go to GitHub Actions → "Version Bump & Changelog"
2. Click "Run workflow"
3. Select branch: `main`
4. Choose `bump_type`:
   - `auto` (recommended): git-cliff auto-detects from commits
   - `major`/`minor`/`patch`: Force specific bump type
5. Click "Run workflow"

### Re-publish a Release

1. Go to GitHub Actions → "Publish Release"
2. Click "Run workflow"
3. Enter the tag name (e.g., `v0.1.0`)
4. Click "Run workflow"

## Troubleshooting

### Version Bump Not Triggering

**Issue:** Workflow doesn't run after PR merge.

**Solutions:**
- Check if PR was actually merged (not just closed)
- Verify workflow file is in `.github/workflows/`
- Check GitHub Actions tab for any errors

### Version Calculation Issues

**Issue:** Wrong version calculated.

**Solutions:**
- Verify commits follow conventional commit format
- Check `cliff.toml` configuration
- Review workflow logs for git-cliff output
- Ensure tags are fetched correctly (`git fetch --tags --force`)

### Changelog Not Generated

**Issue:** Changelog is empty or missing.

**Solutions:**
- Verify commits since last tag exist
- Check git-cliff output in workflow logs
- Ensure `GITHUB_TOKEN` is set (for PR links and GitHub integration)
- Verify `cliff.toml` configuration is correct
- Check that commits follow conventional commit format

### GitHub Integration Not Working

**Issue:** PR links, usernames, or contributor info not appearing in changelog.

**Solutions:**
- Verify `GITHUB_TOKEN` is set in workflow (automatically provided via `secrets.GITHUB_TOKEN`)
- Check that commits are associated with PRs (squash merges work fine)
- Ensure `[remote.github]` is configured in `cliff.toml` with correct owner/repo
- Verify GitHub API rate limits haven't been exceeded
- Check workflow logs for GitHub API errors
- Note: GitHub integration requires commits to be associated with PRs - direct commits to main won't have PR links

### npm Publish Fails

**Issue:** npm publish fails with authentication error.

**Solutions:**
- Verify trusted publishing is configured in npm for repository and environment
- Check `production` environment is set in workflow
- Ensure `id-token: write` permission is set
- Verify `setup-node` is configured **before** `pnpm/action-setup`
- Check `registry-url: 'https://registry.npmjs.org'` is set
- Verify package name and version in `package.json`
- See "npm Trusted Publishing" section above for detailed troubleshooting

### Tag Already Exists

**Issue:** Workflow fails because tag already exists.

**Solutions:**
- Delete the tag locally: `git tag -d vX.Y.Z`
- Delete the tag remotely: `git push origin --delete vX.Y.Z`
- Re-run the workflow

## Configuration Files

### `cliff.toml`

Main configuration for git-cliff:
- Commit parsers (conventional commits)
- Version bump rules
- Changelog template
- GitHub integration

### `package.json`

Contains:
- Current version
- npm scripts (optional, for local use)
- Package metadata

## Squash Merge Support

### How It Works

When you **squash merge** a PR, GitHub creates a **single commit** on `main` with:
- **Commit message**: The PR title (should follow conventional commits: `feat:`, `fix:`, etc.)
- **Commit body**: The PR description (optional)

**git-cliff automatically processes all commits**, including squash merge commits. The workflow:

1. ✅ Squash merge creates a single commit on `main`
2. ✅ git-cliff processes this commit just like any other commit
3. ✅ Commit message is parsed using conventional commit rules
4. ✅ Changelog entry is generated based on commit type (feat → Added, fix → Fixed, etc.)

### Best Practices for Squash Merges

- **Use conventional commits in PR titles**: `feat: add feature`, `fix: resolve bug`, etc.
- **Include PR references**: The commit message can include `(#123)` which will be converted to a PR link
- **PR descriptions are optional**: git-cliff primarily uses the commit message (PR title)

### Example

**PR Title**: `feat: add search functionality (#42)`

**After squash merge**:
- Creates commit: `feat: add search functionality (#42)`
- git-cliff processes it as a `feat:` commit
- Appears in changelog under "### Added"
- PR link is automatically added: `([#42](https://github.com/JSONbored/safemocker/pull/42))`

### Configuration

The `commit_preprocessors` in `cliff.toml` handle:
- Standard GitHub PR merge messages: `Merge pull request #123`
- PR references in commit messages: `(#123)`
- Squash merge commits (processed automatically)

## npm Trusted Publishing

### Overview

The release workflow uses **npm Trusted Publishing** with OIDC (OpenID Connect) for secure, tokenless authentication. This eliminates the need for `NODE_AUTH_TOKEN` secrets.

### Requirements

1. **Environment name**: Must match npm trusted publisher configuration (currently `production`)
2. **Permissions**: `id-token: write` is required (already set in workflow)
3. **setup-node order**: Must be configured **before** pnpm setup for OIDC to work
4. **registry-url**: Must be set to `https://registry.npmjs.org`
5. **--provenance flag**: Creates signed provenance statements

### How It Works

1. GitHub Actions generates an OIDC token automatically
2. `setup-node@v4` with `registry-url` configures npm to use OIDC
3. `npm publish --provenance` uses the OIDC token for authentication
4. npm verifies the token against your trusted publisher configuration
5. Package is published with signed provenance

### Verification

After publishing, the workflow verifies the package is available on npm:

```bash
npm view "@jsonbored/safemocker@$VERSION" version
```

If this fails, the workflow will report an error.

### Troubleshooting npm Trusted Publishing

**Issue**: npm publish fails with authentication error

**Solutions**:
1. Verify environment name matches npm trusted publisher config (`production`)
2. Check that `id-token: write` permission is set in workflow
3. Ensure `setup-node` is configured before `pnpm/action-setup`
4. Verify `registry-url: 'https://registry.npmjs.org'` is set
5. Check npm trusted publisher configuration: https://docs.npmjs.com/trusted-publishers/

**Issue**: Package not found after publish

**Solutions**:
1. Wait a few seconds - npm registry may need time to update
2. Check npm registry directly: https://www.npmjs.com/package/@jsonbored/safemocker
3. Verify the version number matches exactly
4. Check workflow logs for publish errors

## Best Practices

1. **Use Conventional Commits:** Always use conventional commit format (`feat:`, `fix:`, etc.)
2. **Squash Merges:** Use squash merges for PRs to maintain clean history (fully supported)
3. **Don't Commit Changelog Manually:** Let workflows handle changelog updates
4. **Test Locally:** Use `pnpm exec git-cliff --bumped-version` to preview version
5. **Review Before Merging:** Check PR commits to ensure correct version bump
6. **Verify npm Publishing:** Check workflow logs to ensure package was published successfully

## Local Development

### Preview Next Version

```bash
pnpm exec git-cliff --config cliff.toml --bumped-version
```

### Preview Changelog

```bash
pnpm exec git-cliff --config cliff.toml --latest --unreleased
```

### Generate Versioned Changelog (Local)

```bash
pnpm exec git-cliff --config cliff.toml --tag v0.2.0 --latest --unreleased
```

### Manual Version Bump (Optional)

The scripts `scripts/bump-version.ts` and `scripts/analyze-commits.ts` are available for local use but are not required - git-cliff handles everything in CI.

---

**Last Updated:** 2025-12-27
**Maintained By:** Automated workflows with git-cliff

