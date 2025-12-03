# Property-Based Tests

This directory contains property-based tests using fast-check library.

## Structure

- `scanner/` - Scanner rule properties
- `progress/` - Progress tracking properties
- `api/` - API behavior properties
- `security/` - Security properties
- `generators/` - Test data generators

## Running Tests

```bash
npm test
```

## Writing Property Tests

Each property test should:
1. Be tagged with the property number from the design document
2. Run at least 100 iterations
3. Use appropriate generators from `generators/`
4. Test a universal property that should hold for all inputs

Example:
```typescript
// Property 1: Progress percentage bounds
it('should keep progress percentage between 0-100 for all file counts', () => {
  fc.assert(
    fc.property(fileCountArb, ({ processed, total }) => {
      const percentage = calculateProgress(processed, total);
      return percentage >= 0 && percentage <= 100;
    }),
    { numRuns: 100 }
  );
});
```
