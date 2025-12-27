# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- enhance GitHub Actions workflow to extract specific changelog section for releases
- add output schema validation to action handlers and update package structure for CommonJS
- add git-cliff configuration for automated changelog generation and enhance CI workflows
- enhance auto-release workflow to support manual version bump types and improve detection logic
- implement version calculation and validation in auto-release workflow for improved version management
- update Jest configuration to use v8 coverage provider for improved performance and avoid instrumentation conflicts; refactor helper exports to prevent coverage issues
- enhance Jest configuration for improved coverage tracking and add tests for output schema validation and default values in action clients
- improve changelog generation in auto-release workflow by checking for existing entries and updating version sections

### Changed

- update auto-release and release workflows to improve version tagging and push process, ensuring commit verification before tagging
- migrate version bumping to git-cliff
- rename workflows and fix commit counting with comprehensive debugging

### Fixed

- update auto-release workflow to use pnpm for executing git-cliff, ensuring consistent environment for changelog generation
- remove empty env block from release.yml workflow

## [0.1.0] - 2025-12-23

### Added
- Initial release of safemocker
- Type-safe mocking for next-safe-action v8
- Jest and Vitest adapter support
- Comprehensive middleware replication (auth, rate limiting, metadata validation)
- Helper factories for common patterns (`createAuthedActionClient`, `createCompleteActionClient`, etc.)
- Full TypeScript support with proper type inference
- Comprehensive test suite (110 tests, all passing)
- Example files demonstrating various usage patterns:
  - Basic user management actions
  - Complex content management with discriminated unions
  - Nested validation, partial updates, batch operations
- Complete documentation with Jest and Vitest integration guides
- Support for all next-safe-action v8 action client API features

### Features
- ✅ Input validation with Zod v4
- ✅ Middleware chain execution matching real next-safe-action behavior
- ✅ Context passing and merging (`next({ ctx: ... })` format)
- ✅ Proper `SafeActionResult` structure (data, serverError, fieldErrors, validationErrors)
- ✅ Production vs development error handling
- ✅ Authentication middleware (authedAction, optionalAuthAction)
- ✅ Rate limiting middleware
- ✅ Metadata validation middleware
- ✅ Dual CJS/ESM builds for Jest and Vitest compatibility

[unreleased]: https://github.com/JSONbored/safemocker/compare/v0.1.0..HEAD
[0.1.0]: https://github.com/JSONbored/safemocker/releases/tag/v0.1.0
