import * as fc from 'fast-check';
import { Issue, HauntingType, Severity } from '@codecrypt/shared';
import {
  canExorcise,
  generateBranchName,
  generateCommitMessage,
} from '../exorcism';

describe('Exorcism Service', () => {
  describe('Property Tests', () => {
    // Feature: codecrypt, Property 26: Auto-fixability determination
    // **Validates: Requirements 6.1**
    test('canExorcise should correctly determine auto-fixability based on haunting type and rule', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            scanId: fc.uuid(),
            hauntingType: fc.constantFrom<HauntingType>(
              'ghost',
              'zombie',
              'vampire',
              'skeleton',
              'monster'
            ),
            severity: fc.constantFrom<Severity>('low', 'medium', 'high', 'critical'),
            filePath: fc.string({ minLength: 1 }),
            startLine: fc.integer({ min: 1, max: 1000 }),
            endLine: fc.integer({ min: 1, max: 1000 }),
            codeSnippet: fc.string(),
            ruleId: fc.string({ minLength: 1 }),
            message: fc.string({ minLength: 1 }),
            createdAt: fc.date(),
          }),
          (issue: Issue) => {
            const result = canExorcise(issue);

            // Auto-fixable rules
            const isAutoFixableGhost =
              issue.hauntingType === 'ghost' &&
              (issue.ruleId.includes('unused-import') || issue.ruleId.includes('unused-var'));

            const isAutoFixableSkeleton =
              issue.hauntingType === 'skeleton' && issue.ruleId.includes('missing-jsdoc');

            const expectedResult = isAutoFixableGhost || isAutoFixableSkeleton;

            // The function should return true only for auto-fixable issues
            return result === expectedResult;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: codecrypt, Property 28: Branch naming convention
    // **Validates: Requirements 6.3**
    test('generateBranchName should follow the pattern codecrypt/fix-{hauntingType}-{issueId}', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            scanId: fc.uuid(),
            hauntingType: fc.constantFrom<HauntingType>(
              'ghost',
              'zombie',
              'vampire',
              'skeleton',
              'monster'
            ),
            severity: fc.constantFrom<Severity>('low', 'medium', 'high', 'critical'),
            filePath: fc.string({ minLength: 1 }),
            startLine: fc.integer({ min: 1, max: 1000 }),
            endLine: fc.integer({ min: 1, max: 1000 }),
            codeSnippet: fc.string(),
            ruleId: fc.string({ minLength: 1 }),
            message: fc.string({ minLength: 1 }),
            createdAt: fc.date(),
          }),
          (issue: Issue) => {
            const branchName = generateBranchName(issue);

            // Should start with codecrypt/fix-
            const startsCorrectly = branchName.startsWith('codecrypt/fix-');

            // Should contain the haunting type
            const containsHauntingType = branchName.includes(issue.hauntingType);

            // Should contain part of the issue ID (first 8 chars)
            const shortId = issue.id.substring(0, 8);
            const containsIssueId = branchName.includes(shortId);

            // Should follow the exact pattern
            const expectedPattern = `codecrypt/fix-${issue.hauntingType}-${shortId}`;
            const matchesPattern = branchName === expectedPattern;

            return startsCorrectly && containsHauntingType && containsIssueId && matchesPattern;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: codecrypt, Property 29: Commit message completeness
    // **Validates: Requirements 6.4**
    test('generateCommitMessage should reference issue ID and describe the fix', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            scanId: fc.uuid(),
            hauntingType: fc.constantFrom<HauntingType>(
              'ghost',
              'zombie',
              'vampire',
              'skeleton',
              'monster'
            ),
            severity: fc.constantFrom<Severity>('low', 'medium', 'high', 'critical'),
            filePath: fc.string({ minLength: 1 }),
            startLine: fc.integer({ min: 1, max: 1000 }),
            endLine: fc.integer({ min: 1, max: 1000 }),
            codeSnippet: fc.string(),
            ruleId: fc.string({ minLength: 1 }),
            message: fc.string({ minLength: 1 }),
            createdAt: fc.date(),
          }),
          (issue: Issue) => {
            const commitMessage = generateCommitMessage(issue);

            // Should contain the issue ID
            const containsIssueId = commitMessage.includes(issue.id);

            // Should contain the haunting type
            const containsHauntingType = commitMessage.includes(issue.hauntingType);

            // Should contain the file path
            const containsFilePath = commitMessage.includes(issue.filePath);

            // Should contain line numbers
            const containsLineNumbers =
              commitMessage.includes(issue.startLine.toString()) &&
              commitMessage.includes(issue.endLine.toString());

            // Should contain the rule ID
            const containsRuleId = commitMessage.includes(issue.ruleId);

            // Should contain the message
            const containsMessage = commitMessage.includes(issue.message);

            return (
              containsIssueId &&
              containsHauntingType &&
              containsFilePath &&
              containsLineNumbers &&
              containsRuleId &&
              containsMessage
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: codecrypt, Property 28: Branch naming convention - Uniqueness
    // **Validates: Requirements 6.3**
    test('generateBranchName should produce unique names for different issues', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              scanId: fc.uuid(),
              hauntingType: fc.constantFrom<HauntingType>(
                'ghost',
                'zombie',
                'vampire',
                'skeleton',
                'monster'
              ),
              severity: fc.constantFrom<Severity>('low', 'medium', 'high', 'critical'),
              filePath: fc.string({ minLength: 1 }),
              startLine: fc.integer({ min: 1, max: 1000 }),
              endLine: fc.integer({ min: 1, max: 1000 }),
              codeSnippet: fc.string(),
              ruleId: fc.string({ minLength: 1 }),
              message: fc.string({ minLength: 1 }),
              createdAt: fc.date(),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (issues: Issue[]) => {
            const branchNames = issues.map(generateBranchName);

            // Create a set to check uniqueness
            const uniqueBranchNames = new Set(branchNames);

            // If all issue IDs are unique, all branch names should be unique
            const uniqueIssueIds = new Set(issues.map((i) => i.id));
            if (uniqueIssueIds.size === issues.length) {
              return uniqueBranchNames.size === issues.length;
            }

            // If there are duplicate issue IDs, we might have duplicate branch names
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    test('canExorcise returns true for unused-import ghost', () => {
      const issue: Issue = {
        id: '123',
        scanId: '456',
        hauntingType: 'ghost',
        severity: 'low',
        filePath: 'test.ts',
        startLine: 1,
        endLine: 1,
        codeSnippet: 'import unused from "module";',
        ruleId: 'unused-import',
        message: 'Unused import',
        createdAt: new Date(),
      };

      expect(canExorcise(issue)).toBe(true);
    });

    test('canExorcise returns false for vampire issues', () => {
      const issue: Issue = {
        id: '123',
        scanId: '456',
        hauntingType: 'vampire',
        severity: 'high',
        filePath: 'test.ts',
        startLine: 1,
        endLine: 10,
        codeSnippet: 'nested loops',
        ruleId: 'performance-issue',
        message: 'Performance issue',
        createdAt: new Date(),
      };

      expect(canExorcise(issue)).toBe(false);
    });

    test('generateBranchName creates correct format', () => {
      const issue: Issue = {
        id: '12345678-1234-1234-1234-123456789012',
        scanId: '456',
        hauntingType: 'ghost',
        severity: 'low',
        filePath: 'test.ts',
        startLine: 1,
        endLine: 1,
        codeSnippet: 'code',
        ruleId: 'unused-var',
        message: 'Unused variable',
        createdAt: new Date(),
      };

      const branchName = generateBranchName(issue);
      expect(branchName).toBe('codecrypt/fix-ghost-12345678');
    });

    test('generateCommitMessage includes all required information', () => {
      const issue: Issue = {
        id: '123',
        scanId: '456',
        hauntingType: 'ghost',
        severity: 'low',
        filePath: 'src/test.ts',
        startLine: 5,
        endLine: 7,
        codeSnippet: 'const unused = 1;',
        ruleId: 'unused-var',
        message: 'Unused variable "unused"',
        createdAt: new Date(),
      };

      const commitMessage = generateCommitMessage(issue);

      expect(commitMessage).toContain('123');
      expect(commitMessage).toContain('ghost');
      expect(commitMessage).toContain('src/test.ts');
      expect(commitMessage).toContain('5');
      expect(commitMessage).toContain('7');
      expect(commitMessage).toContain('unused-var');
      expect(commitMessage).toContain('Unused variable "unused"');
    });
  });
});
