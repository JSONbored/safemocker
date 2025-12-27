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
- Ensure `GITHUB_TOKEN` is set (for PR links)
- Verify `cliff.toml` configuration is correct

### npm Publish Fails

**Issue:** npm publish fails with authentication error.

**Solutions:**
- Verify trusted publishing is configured in npm
- Check `production` environment is set in workflow
- Ensure `id-token: write` permission is set
- Verify package name and version in `package.json`

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

## Best Practices

1. **Use Conventional Commits:** Always use conventional commit format (`feat:`, `fix:`, etc.)
2. **Squash Merges:** Use squash merges for PRs to maintain clean history
3. **Don't Commit Changelog Manually:** Let workflows handle changelog updates
4. **Test Locally:** Use `pnpm exec git-cliff --bumped-version` to preview version
5. **Review Before Merging:** Check PR commits to ensure correct version bump

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

