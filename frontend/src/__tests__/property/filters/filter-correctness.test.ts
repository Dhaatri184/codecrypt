/**
 * Property-based test for filter correctness
 * **Feature: feature-enhancements, Property 1: Filter correctness**
 * **Validates: Requirements 1.2**
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { filterIssues } from '../../../utils/filters';
import { IssueFilters, HauntingType, Severity } from '../../../hooks/useFilters';
import { issueArb, filterCriteriaArb } from '../generators/features';

describe('Property 1: Filter correctness', () => {
  it('should only return issues matching all filter criteria', () => {
    fc.assert(
      fc.property(
        fc.array(issueArb, { minLength: 0, maxLength: 100 }),
        filterCriteriaArb,
        (issues, filterCriteria) => {
          // Apply filters
          const filters: IssueFilters = {
            hauntingTypes: filterCriteria.hauntingTypes as HauntingType[],
            severities: filterCriteria.severities as Severity[],
            filePaths: filterCriteria.filePaths,
            searchTerm: filterCriteria.searchTerm,
            showDismissed: filterCriteria.showDismissed,
          };

          const filtered = filterIssues(issues as any, filters);

          // Property: All filtered issues must match the filter criteria
          return filtered.every((issue) => {
            // Check haunting type filter
            if (filters.hauntingTypes.length > 0) {
              if (!filters.hauntingTypes.includes(issue.hauntingType)) {
                return false;
              }
            }

            // Check severity filter
            if (filters.severities.length > 0) {
              if (!filters.severities.includes(issue.severity)) {
                return false;
              }
            }

            // Check file path filter
            if (filters.filePaths.length > 0) {
              const matchesPath = filters.filePaths.some((path) =>
                issue.filePath.includes(path)
              );
              if (!matchesPath) {
                return false;
              }
            }

            // Check search term
            if (filters.searchTerm && filters.searchTerm.length > 0) {
              const searchLower = filters.searchTerm.toLowerCase();
              const matchesSearch =
                issue.filePath.toLowerCase().includes(searchLower) ||
                issue.message.toLowerCase().includes(searchLower) ||
                (issue.codeSnippet &&
                  issue.codeSnippet.toLowerCase().includes(searchLower));
              if (!matchesSearch) {
                return false;
              }
            }

            // Check dismissed filter
            if (!filters.showDismissed && issue.dismissed) {
              return false;
            }

            return true;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not filter out issues that match all criteria', () => {
    fc.assert(
      fc.property(
        fc.array(issueArb, { minLength: 1, maxLength: 50 }),
        (issues) => {
          // Create a filter that should match the first issue
          const firstIssue = issues[0];
          const filters: IssueFilters = {
            hauntingTypes: [firstIssue.hauntingType as HauntingType],
            severities: [firstIssue.severity as Severity],
            filePaths: [],
            searchTerm: '',
            showDismissed: true,
          };

          const filtered = filterIssues(issues as any, filters);

          // Property: The first issue should be in the filtered results
          return filtered.some((issue) => issue.id === firstIssue.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no issues match filters', () => {
    fc.assert(
      fc.property(fc.array(issueArb, { minLength: 0, maxLength: 50 }), (issues) => {
        // Create a filter with impossible criteria
        const filters: IssueFilters = {
          hauntingTypes: [],
          severities: [],
          filePaths: ['__NONEXISTENT_PATH__'],
          searchTerm: '',
          showDismissed: false,
        };

        const filtered = filterIssues(issues as any, filters);

        // Property: Should return empty or only issues matching the impossible path
        return filtered.every((issue) =>
          issue.filePath.includes('__NONEXISTENT_PATH__')
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should return all issues when no filters are applied', () => {
    fc.assert(
      fc.property(fc.array(issueArb, { minLength: 0, maxLength: 50 }), (issues) => {
        // Create empty filters
        const filters: IssueFilters = {
          hauntingTypes: [],
          severities: [],
          filePaths: [],
          searchTerm: '',
          showDismissed: true,
        };

        const filtered = filterIssues(issues as any, filters);

        // Property: Should return all issues
        return filtered.length === issues.length;
      }),
      { numRuns: 100 }
    );
  });
});
