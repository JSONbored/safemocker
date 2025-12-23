---
name: Bug Report
about: Report a bug or issue with safemocker
title: '[BUG] '
labels: bug
assignees: ''
---

## Description

A clear and concise description of what the bug is.

## Reproduction Steps

1. Set up action with...
2. Call action with...
3. Expected result: ...
4. Actual result: ...

## Code Example

```typescript
// Minimal reproduction code
const action = createMockSafeActionClient()
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    return { id: parsedInput.id };
  });

const result = await action({ id: 'test' });
// Issue occurs here...
```

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Environment

- **safemocker version:** 
- **next-safe-action version:** 
- **Jest/Vitest version:** 
- **Node.js version:** 
- **OS:** 

## Additional Context

Add any other context, screenshots, or error messages about the problem here.

