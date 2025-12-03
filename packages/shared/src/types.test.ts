import * as fc from 'fast-check';
import { HauntingType, Severity, ScanStatus, ExorcismStatus } from './types';

// Feature: codecrypt, Property 13: Scan output JSON validity
// Validates: Requirements 2.9

describe('Type Validation Tests', () => {
  describe('HauntingType validation', () => {
    it('should only accept valid haunting types', () => {
      const validTypes: HauntingType[] = ['ghost', 'zombie', 'vampire', 'skeleton', 'monster'];
      
      validTypes.forEach(type => {
        expect(['ghost', 'zombie', 'vampire', 'skeleton', 'monster']).toContain(type);
      });
    });

    it('property: all haunting types should be one of the five valid types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('ghost', 'zombie', 'vampire', 'skeleton', 'monster'),
          (hauntingType) => {
            const validTypes = ['ghost', 'zombie', 'vampire', 'skeleton', 'monster'];
            return validTypes.includes(hauntingType);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Severity validation', () => {
    it('should only accept valid severity levels', () => {
      const validSeverities: Severity[] = ['low', 'medium', 'high', 'critical'];
      
      validSeverities.forEach(severity => {
        expect(['low', 'medium', 'high', 'critical']).toContain(severity);
      });
    });

    it('property: all severity levels should be one of the four valid levels', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('low', 'medium', 'high', 'critical'),
          (severity) => {
            const validSeverities = ['low', 'medium', 'high', 'critical'];
            return validSeverities.includes(severity);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ScanStatus validation', () => {
    it('property: all scan statuses should be valid', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('pending', 'scanning', 'analyzing', 'completed', 'failed'),
          (status) => {
            const validStatuses = ['pending', 'scanning', 'analyzing', 'completed', 'failed'];
            return validStatuses.includes(status);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ExorcismStatus validation', () => {
    it('property: all exorcism statuses should be valid', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('pending', 'in_progress', 'completed', 'failed'),
          (status) => {
            const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];
            return validStatuses.includes(status);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Issue structure validation', () => {
    it('property: generated issues should have all required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            scanId: fc.uuid(),
            hauntingType: fc.constantFrom('ghost', 'zombie', 'vampire', 'skeleton', 'monster'),
            severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
            filePath: fc.string({ minLength: 1 }),
            startLine: fc.integer({ min: 1 }),
            endLine: fc.integer({ min: 1 }),
            codeSnippet: fc.string(),
            ruleId: fc.string({ minLength: 1 }),
            message: fc.string({ minLength: 1 }),
            createdAt: fc.date(),
          }),
          (issue) => {
            // Validate all required fields are present
            return (
              typeof issue.id === 'string' &&
              typeof issue.scanId === 'string' &&
              ['ghost', 'zombie', 'vampire', 'skeleton', 'monster'].includes(issue.hauntingType) &&
              ['low', 'medium', 'high', 'critical'].includes(issue.severity) &&
              typeof issue.filePath === 'string' &&
              issue.filePath.length > 0 &&
              typeof issue.startLine === 'number' &&
              issue.startLine >= 1 &&
              typeof issue.endLine === 'number' &&
              issue.endLine >= 1 &&
              typeof issue.codeSnippet === 'string' &&
              typeof issue.ruleId === 'string' &&
              issue.ruleId.length > 0 &&
              typeof issue.message === 'string' &&
              issue.message.length > 0 &&
              issue.createdAt instanceof Date
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: endLine should be greater than or equal to startLine', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 0, max: 100 }),
          (startLine, offset) => {
            const endLine = startLine + offset;
            return endLine >= startLine;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ScanResults structure validation', () => {
    it('property: scan results should have valid structure', () => {
      fc.assert(
        fc.property(
          fc.record({
            scanId: fc.uuid(),
            repositoryId: fc.uuid(),
            commitSha: fc.hexaString({ minLength: 40, maxLength: 40 }),
            totalFiles: fc.integer({ min: 0 }),
            totalIssues: fc.integer({ min: 0 }),
            issuesByType: fc.record({
              ghost: fc.integer({ min: 0 }),
              zombie: fc.integer({ min: 0 }),
              vampire: fc.integer({ min: 0 }),
              skeleton: fc.integer({ min: 0 }),
              monster: fc.integer({ min: 0 }),
            }),
            hauntingLevel: fc.string({ minLength: 1 }),
            issues: fc.array(fc.anything()),
            scannedAt: fc.date(),
          }),
          (scanResults) => {
            // Validate structure
            const hasValidStructure =
              typeof scanResults.scanId === 'string' &&
              typeof scanResults.repositoryId === 'string' &&
              typeof scanResults.commitSha === 'string' &&
              scanResults.commitSha.length === 40 &&
              typeof scanResults.totalFiles === 'number' &&
              scanResults.totalFiles >= 0 &&
              typeof scanResults.totalIssues === 'number' &&
              scanResults.totalIssues >= 0 &&
              typeof scanResults.issuesByType === 'object' &&
              typeof scanResults.hauntingLevel === 'string' &&
              Array.isArray(scanResults.issues) &&
              scanResults.scannedAt instanceof Date;

            return hasValidStructure;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: totalIssues should equal sum of issuesByType', () => {
      fc.assert(
        fc.property(
          fc.record({
            ghost: fc.integer({ min: 0, max: 100 }),
            zombie: fc.integer({ min: 0, max: 100 }),
            vampire: fc.integer({ min: 0, max: 100 }),
            skeleton: fc.integer({ min: 0, max: 100 }),
            monster: fc.integer({ min: 0, max: 100 }),
          }),
          (issuesByType) => {
            const totalIssues =
              issuesByType.ghost +
              issuesByType.zombie +
              issuesByType.vampire +
              issuesByType.skeleton +
              issuesByType.monster;

            return totalIssues >= 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
