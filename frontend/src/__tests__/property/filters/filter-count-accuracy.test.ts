/**
 * Property-based test for filter count accuracy
 * **Feature: feature-enhancements, Property 3: Filter count accuracy**
 * **Validates: Requirements 1.4**
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { filterIssues, getFilteredCounts } from '../../../utils/filters';
import { IssueFilters } from '../../../hooks/useFilters';
import { issueArb, filterCriteriaArb } from '../generators/features';

describe('Property 3: Filter count accuracy', () => {
  it('should return accurate filtered and total counts', () => {
    fc.assert(
      fc.property(
        fc.array(issueArb, { minLength: 0, maxLength: 100 }),
        filterCriteriaArb,
        (issues, filterCriteria) => {
          // Apply filters
          const filters: IssueFilters = {
            hauntingTypes: filterCriteria.hauntingTypes as any,
            severities: filterCriteria.severities as any,
            filePaths: filterCriteria.filePaths,
            searchTerm: filterCriteria.searchTerm,
            showDismissed: filterCriteria.showDismissed,
          };

          const filtered = filterIssues(issues as any, filters);
          const counts = getFilteredCounts(issues as any, filters);

          // Property: Counts must match actual filtered results
          return (
            counts.filtered === filtered.length &&
            counts.total === issues.length
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have filtered count less than or equal to total count', () => {
    fc.assert(
      fc.property(
        fc.array(issueArb, { minLength: 0, maxLength: 100 }),
        filterCriteriaArb,
        (issues, filterCriteria) => {
          const filters: IssueFilters = {
            hauntingTypes: filterCriteria.hauntingTypes as any,
            severities: filterCriteria.severities as any,
            filePaths: filterCriteria.filePaths,
            searchTerm: filterCriteria.searchTerm,
            showDismissed: filterCriteria.showDismissed,
          };

          const counts = getFilteredCounts(issues as any, filters);

          // Property: Filtered count should never exceed total count
          return counts.filtered <= counts.total;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have equal counts when no filters are applied', () => {
    fc.assert(
      fc.property(fc.array(issueArb, { minLength: 0, maxLength: 50 }), (issues) => {
        const filters: IssueFilters = {
          hauntingTypes: [],
          severities: [],
          filePaths: [],
          searchTerm: '',
          showDismissed: true,
        };

        const counts = getFilteredCounts(issues as any, filters);

        // Property: With no filters, filtered should equal total
        return counts.filtered === counts.total;
      }),
      { numRuns: 100 }
    );
  });

  it('should have zero filtered count when no issues match', () => {
    fc.assert(
      fc.property(fc.array(issueArb, { minLength: 0, maxLength: 50 }), (issues) => {
        const filters: IssueFilters = {
          hauntingTypes: [],
          severities: [],
          filePaths: ['__IMPOSSIBLE_PATH_THAT_NEVER_EXISTS__'],
          searchTerm: '',
          showDismissed: false,
        };

        const counts = getFilteredCounts(issues as any, filters);

        // Property: Should have zero or very few filtered issues
        return counts.filtered <= issues.filter((i: any) => 
          i.filePath.includes('__IMPOSSIBLE_PATH_THAT_NEVER_EXISTS__')
        ).length;
      }),
      { numRuns: 100 }
    );
  });
});
