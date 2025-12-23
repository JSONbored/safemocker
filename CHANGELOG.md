# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

