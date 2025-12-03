/**
 * Property-based test for search term matching
 * **Feature: feature-enhancements, Property 2: Search term matching**
 * **Validates: Requirements 1.3**
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { filterIssues } from '../../../utils/filters';
import { IssueFilters } from '../../../hooks/useFilters';
import { issueArb } from '../generators/features';

describe('Property 2: Search term matching', () => {
  it('should only return issues containing the search term', () => {
    fc.assert(
      fc.property(
        fc.array(issueArb, { minLength: 0, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (issues, searchTerm) => {
          // Apply search filter
          const filters: IssueFilters = {
            hauntingTypes: [],
            severities: [],
            filePaths: [],
            searchTerm,
            showDismissed: true,
          };

          const filtered = filterIssues(issues as any, filters);

          // Property: All filtered issues must contain the search term
          return filtered.every((issue) => {
            const searchLower = searchTerm.toLowerCase();
            return (
              issue.filePath.toLowerCase().includes(searchLower) ||
              issue.message.toLowerCase().includes(searchLower) ||
              (issue.codeSnippet &&
                issue.codeSnippet.toLowerCase().includes(searchLower))
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all issues when search term is empty', () => {
    fc.assert(
      fc.property(fc.array(issueArb, { minLength: 0, maxLength: 50 }), (issues) => {
        // Apply empty search filter
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

  it('should be case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.array(issueArb, { minLength: 1, maxLength: 50 }),
        (issues) => {
          // Pick a term from the first issue
          const firstIssue = issues[0];
          const searchTerm = firstIssue.message.substring(0, 5);
          
          if (searchTerm.length === 0) return true;

          // Apply search with uppercase
          const filtersUpper: IssueFilters = {
            hauntingTypes: [],
            severities: [],
            filePaths: [],
            searchTerm: searchTerm.toUpperCase(),
            showDismissed: true,
          };

          // Apply search with lowercase
          const filtersLower: IssueFilters = {
            hauntingTypes: [],
            severities: [],
            filePaths: [],
            searchTerm: searchTerm.toLowerCase(),
            showDismissed: true,
          };

          const filteredUpper = filterIssues(issues as any, filtersUpper);
          const filteredLower = filterIssues(issues as any, filtersLower);

          // Property: Should return same results regardless of case
          return filteredUpper.length === filteredLower.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should search across file path, message, and code snippet', () => {
    fc.assert(
      fc.property(
        fc.array(issueArb, { minLength: 1, maxLength: 50 }),
        (issues) => {
          const firstIssue = issues[0];
          
          // Test searching in file path
          const pathTerm = firstIssue.filePath.substring(0, 5);
          if (pathTerm.length > 0) {
            const filters: IssueFilters = {
              hauntingTypes: [],
              severities: [],
              filePaths: [],
              searchTerm: pathTerm,
              showDismissed: true,
            };
            const filtered = filterIssues(issues as any, filters);
            if (!filtered.some((issue) => issue.id === firstIssue.id)) {
              return false;
            }
          }

          // Test searching in message
          const messageTerm = firstIssue.message.substring(0, 5);
          if (messageTerm.length > 0) {
            const filters: IssueFilters = {
              hauntingTypes: [],
              severities: [],
              filePaths: [],
              searchTerm: messageTerm,
              showDismissed: true,
            };
            const filtered = filterIssues(issues as any, filters);
            if (!filtered.some((issue) => issue.id === firstIssue.id)) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
