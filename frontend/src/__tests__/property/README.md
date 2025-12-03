# Property-Based Testing Infrastructure

This directory contains the infrastructure for property-based testing of feature enhancements using the `fast-check` library.

## Structure

```
property/
├── generators/
│   └── features.ts       # Test data generators for feature enhancements
├── utils/
│   └── testUtils.ts      # Utility functions for testing
└── README.md             # This file
```

## Generators

The `generators/features.ts` file contains arbitraries (generators) for creating random test data:

### Issue-Related Generators
- `issueArb` - Generate random issues
- `hauntingTypeArb` - Generate haunting types (ghost, zombie, vampire, skeleton, monster)
- `severityArb` - Generate severity levels (low, medium, high, critical)

### Filter & Sort Generators
- `filterCriteriaArb` - Generate filter criteria
- `sortConfigArb` - Generate sort configurations

### Export Generators
- `exportFormatArb` - Generate export formats (json, csv, pdf)

### History & Trends Generators
- `scanHistoryEntryArb` - Generate scan history entries
- `trendDataArb` - Generate trend data
- `scanComparisonArb` - Generate scan comparison data

### Dismissal & Notes Generators
- `issueDismissalArb` - Generate issue dismissals
- `issueNoteArb` - Generate issue notes
- `dismissalReasonArb` - Generate dismissal reasons

### Scheduling Generators
- `scanScheduleArb` - Generate scan schedules
- `scheduleTypeArb` - Generate schedule types
- `scheduleConfigArb` - Generate schedule configurations

### Quality Gates Generators
- `qualityThresholdArb` - Generate quality thresholds
- `qualityScoreArb` - Generate quality scores

### UI Generators
- `themeArb` - Generate theme preferences
- `keyboardShortcutArb` - Generate keyboard shortcuts
- `codeContextArb` - Generate code context
- `aiFixSuggestionArb` - Generate AI fix suggestions

## Test Utilities

The `utils/testUtils.ts` file contains helper functions for testing:

### Array Utilities
- `arraysEqualIgnoreOrder()` - Compare arrays ignoring order
- `isSorted()` - Check if array is sorted
- `isSortedDescending()` - Check if array is sorted descending
- `unique()` - Get unique items
- `intersection()` - Array intersection
- `difference()` - Array difference

### Filter & Search Utilities
- `matchesFilter()` - Check if issue matches filter criteria
- `containsSearchTerm()` - Check if text contains search term

### Sorting Utilities
- `getSeverityOrder()` - Get severity order for sorting
- `compareBySeverity()` - Compare issues by severity
- `compareByFilePath()` - Compare issues by file path

### Validation Utilities
- `isValidJSON()` - Validate JSON format
- `isValidCSV()` - Validate CSV format
- `inRange()` - Check if value is in range

### Calculation Utilities
- `percentage()` - Calculate percentage
- `calculateQualityScore()` - Calculate quality score from issue counts

### Mock Utilities
- `MockLocalStorage` - Mock localStorage for testing
- `MockSessionStorage` - Mock sessionStorage for testing

## Usage Example

```typescript
import * as fc from 'fast-check';
import { issueArb, filterCriteriaArb } from './generators/features';
import { matchesFilter, isSorted } from './utils/testUtils';

// Property test: All filtered issues should match the filter criteria
fc.assert(
  fc.property(
    fc.array(issueArb),
    filterCriteriaArb,
    (issues, filter) => {
      const filtered = issues.filter(issue => matchesFilter(issue, filter));
      return filtered.every(issue => matchesFilter(issue, filter));
    }
  ),
  { numRuns: 100 }
);
```

## Writing Property Tests

1. **Import generators and utilities**
   ```typescript
   import * as fc from 'fast-check';
   import { issueArb } from '../generators/features';
   import { isSorted } from '../utils/testUtils';
   ```

2. **Write the property**
   ```typescript
   fc.assert(
     fc.property(
       fc.array(issueArb),
       (issues) => {
         const sorted = sortIssues(issues, 'severity');
         return isSorted(sorted, compareBySeverity);
       }
     ),
     { numRuns: 100 }
   );
   ```

3. **Tag with property number**
   ```typescript
   // Property 5: Sort order correctness
   // Validates: Requirements 2.2
   test('sorted issues maintain correct order', () => {
     // ... test code
   });
   ```

## Best Practices

1. **Run at least 100 iterations** - Set `numRuns: 100` or higher
2. **Use descriptive test names** - Include property number and description
3. **Tag with requirements** - Reference the requirement being validated
4. **Keep properties simple** - Test one property at a time
5. **Use shrinking** - fast-check will find minimal failing cases
6. **Add edge cases** - Use `fc.examples()` for specific edge cases

## Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://fsharpforfunandprofit.com/posts/property-based-testing/)
- [Design Document](../../.kiro/specs/feature-enhancements/design.md)

