# Property-Based Testing Guide

## Overview

This project uses property-based testing (PBT) with the [fast-check](https://github.com/dubzzz/fast-check) library to verify universal properties that should hold across all inputs.

## What is Property-Based Testing?

Property-based testing validates that certain properties hold true for all possible inputs, rather than testing specific examples. The testing library generates hundreds of random inputs to verify the property.

### Example

Instead of testing:
```typescript
expect(calculateProgress(50, 100)).toBe(50);
expect(calculateProgress(0, 100)).toBe(0);
expect(calculateProgress(100, 100)).toBe(100);
```

We test the universal property:
```typescript
fc.assert(
  fc.property(fileCountArb, ({ processed, total }) => {
    const percentage = calculateProgress(processed, total);
    return percentage >= 0 && percentage <= 100;
  }),
  { numRuns: 100 }
);
```

This tests 100 random combinations and ensures the property holds for ALL inputs.

## Setup

### Installation

fast-check is already installed in both backend and scanner packages:

```bash
# Backend
cd backend
npm install

# Scanner
cd scanner
npm install
```

### Directory Structure

```
backend/src/__tests__/property/
├── README.md
├── generators/
│   └── common.ts          # Shared test data generators
├── progress/              # Progress tracking properties
├── api/                   # API behavior properties
└── security/              # Security properties

scanner/src/__tests__/property/
├── README.md
├── generators/
│   └── scanner.ts         # Scanner-specific generators
└── scanner/               # Scanner rule properties
```

## Writing Property Tests

### 1. Identify the Property

From the design document, identify which universal property you're testing. Each property should be tagged with:
- Property number
- Feature name
- Requirements it validates

### 2. Create Test Generators

Use or create appropriate generators from the `generators/` directory:

```typescript
import * as fc from 'fast-check';

// Generate valid file counts
export const fileCountArb = fc
  .record({
    processed: fc.nat(10000),
    total: fc.nat(10000),
  })
  .filter(({ processed, total }) => processed <= total);
```

### 3. Write the Property Test

```typescript
/**
 * Property 1: Progress percentage bounds
 * Feature: system-improvements, Property 1: Progress percentage bounds
 * Validates: Requirements 1.2
 */

import * as fc from 'fast-check';
import { fileCountArb } from '../generators/common';

describe('Property 1: Progress percentage bounds', () => {
  it('should keep progress percentage between 0-100 for all file counts', () => {
    fc.assert(
      fc.property(fileCountArb, ({ processed, total }) => {
        const percentage = calculateProgress(processed, total);
        return percentage >= 0 && percentage <= 100;
      }),
      { numRuns: 100 }  // Run 100 random tests
    );
  });
});
```

### 4. Run the Tests

```bash
# Run all tests
npm test

# Run specific property test
npm test -- progress-bounds.test.ts

# Run with coverage
npm test -- --coverage
```

## Common Generators

### Available in `backend/src/__tests__/property/generators/common.ts`:

- `fileCountArb` - Valid file counts (processed <= total)
- `progressUpdateArb` - Progress update objects
- `scanIdArb` - UUID scan identifiers
- `errorTypeArb` - Error type strings
- `errorSeverityArb` - Error severity levels
- `structuredErrorArb` - Complete error objects
- `retryConfigArb` - Retry configuration objects
- `scanArb` - Scan objects
- `metricEntryArb` - Metric entry objects
- `apiEndpointArb` - API endpoint paths
- `httpMethodArb` - HTTP methods
- `httpStatusArb` - HTTP status codes

### Available in `scanner/src/__tests__/property/generators/scanner.ts`:

- `filePathArb` - File paths
- `fileContentArb` - File content strings
- `binaryFileArb` - Binary file indicators
- `codeWithErrorsArb` - Code with potential syntax errors
- `repositoryArb` - Repository metadata
- `scanResultArb` - Scan result objects
- `astNodeTypeArb` - AST node types
- `fileDiscoveryArb` - File discovery results

## Best Practices

### 1. Run Enough Iterations

Always run at least 100 iterations (configured in design document):

```typescript
fc.assert(fc.property(arb, prop), { numRuns: 100 });
```

### 2. Use Appropriate Generators

Choose generators that match your domain constraints:

```typescript
// Good: Ensures processed <= total
const fileCountArb = fc.record({
  processed: fc.nat(10000),
  total: fc.nat(10000),
}).filter(({ processed, total }) => processed <= total);

// Bad: Could generate invalid data
const fileCountArb = fc.record({
  processed: fc.nat(10000),
  total: fc.nat(10000),
});
```

### 3. Test One Property Per Test

Each test should verify a single universal property:

```typescript
// Good: Tests one property
it('should keep progress between 0-100', () => {
  fc.assert(fc.property(arb, (data) => {
    const result = calculate(data);
    return result >= 0 && result <= 100;
  }));
});

// Bad: Tests multiple properties
it('should work correctly', () => {
  fc.assert(fc.property(arb, (data) => {
    const result = calculate(data);
    return result >= 0 && result <= 100 && result !== null && ...;
  }));
});
```

### 4. Add Edge Cases as Examples

Supplement property tests with specific edge cases:

```typescript
it('should handle edge case: zero total', () => {
  expect(calculateProgress(0, 0)).toBe(0);
});
```

### 5. Tag Tests with Property Numbers

Always include the property number and requirements in comments:

```typescript
/**
 * Property 1: Progress percentage bounds
 * Feature: system-improvements, Property 1: Progress percentage bounds
 * Validates: Requirements 1.2
 */
```

## Debugging Failed Properties

When a property test fails, fast-check provides:

1. **Seed**: Reproduce the exact failure
2. **Counterexample**: The input that caused failure
3. **Shrunk value**: Minimal failing case

Example failure output:
```
Property failed after 40 tests
{ seed: -1193316021, path: "39", endOnFailure: true }
Counterexample: [0]
```

To reproduce:
```typescript
fc.assert(
  fc.property(arb, prop),
  { seed: -1193316021, path: "39" }
);
```

## Integration with CI/CD

Property tests run automatically with the regular test suite:

```bash
npm test
```

Coverage thresholds are enforced:
- Backend: 80% coverage
- Scanner: 85% coverage

## Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check/tree/main/documentation)
- [Property-Based Testing Introduction](https://github.com/dubzzz/fast-check/blob/main/documentation/1-Guides/Introduction.md)
- [Built-in Arbitraries](https://github.com/dubzzz/fast-check/blob/main/documentation/1-Guides/Arbitraries.md)
- [Design Document](.kiro/specs/system-improvements/design.md) - See Correctness Properties section
