/**
 * Property-based test for filter clear restoration
 * **Feature: feature-enhancements, Property 4: Filter clear restoration**
 * **Validates: Requirements 1.5**
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { filterIssues } from '../../../utils/filters';
import { IssueFilters } from '../../../hooks/useFilters';
import { issueArb, filterCriteriaArb } from '../generators/features';

describe('Property 4: Filter clear restoration', () => {
  it('should restore all issues after clearing filters', () => {
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

          // Filter issues (we don't need to use the result)
          filterIssues(issues as any, filters);

          // Clear filters
          const clearedFilters: IssueFilters = {
            hauntingTypes: [],
            severities: [],
            filePaths: [],
            searchTerm: '',
            showDismissed: true,
          };

          // Filter with cleared filters
          const restored = filterIssues(issues as any, clearedFilters);

          // Property: Clearing filters should restore all issues
          return restored.length === issues.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve issue order after filter clear', () => {
    fc.assert(
      fc.property(
        fc.array(issueArb, { minLength: 0, maxLength: 50 }),
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

          // Filter issues
          filterIssues(issues as any, filters);

          // Clear filters
          const clearedFilters: IssueFilters = {
            hauntingTypes: [],
            severities: [],
            filePaths: [],
            searchTerm: '',
            showDismissed: true,
          };

          // Filter with cleared filters
          const restored = filterIssues(issues as any, clearedFilters);

          // Property: Issues should be in same order
          return restored.every((issue, index) => issue.id === issues[index].id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should restore same issues regardless of previous filter state', () => {
    fc.assert(
      fc.property(
        fc.array(issueArb, { minLength: 0, maxLength: 50 }),
        filterCriteriaArb,
        filterCriteriaArb,
        (issues, filter1, filter2) => {
          // Apply first filter
          const filters1: IssueFilters = {
            hauntingTypes: filter1.hauntingTypes as any,
            severities: filter1.severities as any,
            filePaths: filter1.filePaths,
            searchTerm: filter1.searchTerm,
            showDismissed: filter1.showDismissed,
          };
          filterIssues(issues as any, filters1);

          // Clear filters
          const clearedFilters: IssueFilters = {
            hauntingTypes: [],
            severities: [],
            filePaths: [],
            searchTerm: '',
            showDismissed: true,
          };
          const restored1 = filterIssues(issues as any, clearedFilters);

          // Apply second filter
          const filters2: IssueFilters = {
            hauntingTypes: filter2.hauntingTypes as any,
            severities: filter2.severities as any,
            filePaths: filter2.filePaths,
            searchTerm: filter2.searchTerm,
            showDismissed: filter2.showDismissed,
          };
          filterIssues(issues as any, filters2);

          // Clear filters again
          const restored2 = filterIssues(issues as any, clearedFilters);

          // Property: Should restore same issues regardless of previous filter
          return restored1.length === restored2.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be idempotent - clearing twice has same effect as clearing once', () => {
    fc.assert(
      fc.property(
        fc.array(issueArb, { minLength: 0, maxLength: 50 }),
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
          filterIssues(issues as any, filters);

          // Clear filters
          const clearedFilters: IssueFilters = {
            hauntingTypes: [],
            severities: [],
            filePaths: [],
            searchTerm: '',
            showDismissed: true,
          };

          // Clear once
          const restored1 = filterIssues(issues as any, clearedFilters);

          // Clear again
          const restored2 = filterIssues(issues as any, clearedFilters);

          // Property: Clearing twice should have same effect as clearing once
          return restored1.length === restored2.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});
