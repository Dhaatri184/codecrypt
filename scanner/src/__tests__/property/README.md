# Property-Based Tests

This directory contains property-based tests using fast-check library.

## Structure

- `scanner/` - Scanner rule properties
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
// Property 26: Binary file handling
it('should skip binary files without errors', () => {
  fc.assert(
    fc.property(fileArb, (file) => {
      const result = processFile(file);
      if (isBinary(file)) {
        return result.skipped === true && result.error === null;
      }
      return true;
    }),
    { numRuns: 100 }
  );
});
```
