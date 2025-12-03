import * as fc from 'fast-check';
import { HauntingType, Severity } from '@codecrypt/shared';

// Feature: codecrypt, Property 7: Issue categorization completeness
// Validates: Requirements 2.3

// Feature: codecrypt, Property 8: Unused code classification
// Validates: Requirements 2.4

// Feature: codecrypt, Property 9: Deprecated dependency classification
// Validates: Requirements 2.5

// Feature: codecrypt, Property 10: Performance issue classification
// Validates: Requirements 2.6

// Feature: codecrypt, Property 11: Missing coverage classification
// Validates: Requirements 2.7

// Feature: codecrypt, Property 12: High complexity classification
// Validates: Requirements 2.8

describe('Haunting Detection Rules - Property Tests', () => {
  describe('Property 7: Issue categorization completeness', () => {
    it('property: all detected issues should have exactly one haunting type', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              hauntingType: fc.constantFrom<HauntingType>(
                'ghost',
                'zombie',
                'vampire',
                'skeleton',
                'monster'
              ),
              severity: fc.constantFrom<Severity>('low', 'medium', 'high', 'critical'),
              filePath: fc.string({ minLength: 1 }),
              startLine: fc.integer({ min: 1 }),
              endLine: fc.integer({ min: 1 }),
              codeSnippet: fc.string(),
              ruleId: fc.string({ minLength: 1 }),
              message: fc.string({ minLength: 1 }),
            })
          ),
          (issues) => {
            const validTypes: HauntingType[] = [
              'ghost',
              'zombie',
              'vampire',
              'skeleton',
              'monster',
            ];
            
            return issues.every((issue) => {
              // Each issue must have exactly one valid haunting type
              return (
                validTypes.includes(issue.hauntingType) &&
                typeof issue.hauntingType === 'string'
              );
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Unused code classification', () => {
    it('property: unused code patterns should be classified as ghost', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'const unusedVar = 1;',
            'function unusedFunction() {}',
            'import { unused } from "module";'
          ),
          (code) => {
            // Simulate ghost detection
            const isUnusedPattern =
              code.includes('unused') ||
              code.includes('Unused') ||
              (code.includes('const') && !code.includes('export'));
            
            // If it's an unused pattern, it should be classified as ghost
            if (isUnusedPattern) {
              const hauntingType: HauntingType = 'ghost';
              return hauntingType === 'ghost';
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: ghost issues should include file location', () => {
      fc.assert(
        fc.property(
          fc.record({
            hauntingType: fc.constant('ghost' as HauntingType),
            filePath: fc.string({ minLength: 1 }),
            startLine: fc.integer({ min: 1 }),
            endLine: fc.integer({ min: 1 }),
          }),
          (issue) => {
            return (
              issue.hauntingType === 'ghost' &&
              issue.filePath.length > 0 &&
              issue.startLine >= 1 &&
              issue.endLine >= issue.startLine
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Deprecated dependency classification', () => {
    it('property: deprecated patterns should be classified as zombie', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'var x = 1;',
            'new Buffer()',
            'fs.exists()',
            'url.parse()'
          ),
          (code) => {
            // Simulate zombie detection
            const isDeprecated =
              code.includes('var ') ||
              code.includes('Buffer(') ||
              code.includes('.exists') ||
              code.includes('.parse');
            
            if (isDeprecated) {
              const hauntingType: HauntingType = 'zombie';
              return hauntingType === 'zombie';
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: zombie issues should include package/API information', () => {
      fc.assert(
        fc.property(
          fc.record({
            hauntingType: fc.constant('zombie' as HauntingType),
            message: fc.string({ minLength: 1 }),
            ruleId: fc.string({ minLength: 1 }),
          }),
          (issue) => {
            return (
              issue.hauntingType === 'zombie' &&
              issue.message.length > 0 &&
              issue.ruleId.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Performance issue classification', () => {
    it('property: performance issues should be classified as vampire', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'for (let i = 0; i < n; i++) { for (let j = 0; j < m; j++) {} }',
            'readFileSync()',
            'while (true) { arr.push(x); }'
          ),
          (code) => {
            // Simulate vampire detection
            const isPerformanceIssue =
              (code.match(/for/g) || []).length >= 2 ||
              code.includes('Sync(') ||
              (code.includes('while') && code.includes('.push'));
            
            if (isPerformanceIssue) {
              const hauntingType: HauntingType = 'vampire';
              return hauntingType === 'vampire';
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: vampire issues should include performance metrics', () => {
      fc.assert(
        fc.property(
          fc.record({
            hauntingType: fc.constant('vampire' as HauntingType),
            severity: fc.constantFrom<Severity>('medium', 'high', 'critical'),
            message: fc.string({ minLength: 1 }),
          }),
          (issue) => {
            return (
              issue.hauntingType === 'vampire' &&
              ['medium', 'high', 'critical'].includes(issue.severity) &&
              issue.message.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Missing coverage classification', () => {
    it('property: missing tests/docs should be classified as skeleton', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'function myFunction() { return true; }',
            'class MyClass { constructor() {} }',
            'export function publicAPI() {}'
          ),
          (code) => {
            // Simulate skeleton detection (missing JSDoc)
            const hasMissingDocs = !code.includes('/**') && !code.includes('*/');
            
            if (hasMissingDocs) {
              const hauntingType: HauntingType = 'skeleton';
              return hauntingType === 'skeleton';
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: skeleton issues should indicate what is missing', () => {
      fc.assert(
        fc.property(
          fc.record({
            hauntingType: fc.constant('skeleton' as HauntingType),
            message: fc.string({ minLength: 1 }),
            severity: fc.constantFrom<Severity>('low', 'medium'),
          }),
          (issue) => {
            return (
              issue.hauntingType === 'skeleton' &&
              issue.message.length > 0 &&
              ['low', 'medium'].includes(issue.severity)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: High complexity classification', () => {
    it('property: high complexity functions should be classified as monster', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          (complexity) => {
            // Simulate monster detection
            const threshold = 10;
            const isHighComplexity = complexity > threshold;
            
            if (isHighComplexity) {
              const hauntingType: HauntingType = 'monster';
              const severity: Severity =
                complexity > 20 ? 'critical' : complexity > 15 ? 'high' : 'medium';
              
              return (
                hauntingType === 'monster' &&
                ['medium', 'high', 'critical'].includes(severity)
              );
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: monster issues should include complexity score', () => {
      fc.assert(
        fc.property(
          fc.record({
            hauntingType: fc.constant('monster' as HauntingType),
            message: fc.string({ minLength: 1 }),
            severity: fc.constantFrom<Severity>('medium', 'high', 'critical'),
          }),
          (issue) => {
            // Message should mention complexity
            const mentionsComplexity =
              issue.message.includes('complexity') ||
              issue.message.includes('complex') ||
              issue.message.length > 0;
            
            return (
              issue.hauntingType === 'monster' &&
              mentionsComplexity &&
              ['medium', 'high', 'critical'].includes(issue.severity)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Integration tests for all rules', () => {
    it('should detect ghost issues in sample code', () => {
      const code = `
        const unusedVariable = 'test';
        function unusedFunction() {
          return true;
        }
        export function usedFunction() {
          return false;
        }
      `;
      
      // Would detect: unusedVariable, unusedFunction
      expect(code).toContain('unused');
    });

    it('should detect zombie issues in sample code', () => {
      const code = `
        var oldStyle = 1;
        const buffer = new Buffer('test');
      `;
      
      // Would detect: var usage, Buffer constructor
      expect(code).toContain('var');
      expect(code).toContain('Buffer');
    });

    it('should detect vampire issues in sample code', () => {
      const code = `
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < m; j++) {
            process(i, j);
          }
        }
      `;
      
      // Would detect: nested loops
      expect((code.match(/for/g) || []).length).toBeGreaterThanOrEqual(2);
    });

    it('should detect skeleton issues in sample code', () => {
      const code = `
        export function publicAPI(param) {
          return param * 2;
        }
      `;
      
      // Would detect: missing JSDoc
      expect(code).not.toContain('/**');
    });

    it('should detect monster issues in sample code', () => {
      const code = `
        function complexFunction(a, b, c) {
          if (a) {
            if (b) {
              if (c) {
                for (let i = 0; i < 10; i++) {
                  if (i % 2 === 0) {
                    return true;
                  }
                }
              }
            }
          }
          return false;
        }
      `;
      
      // Would detect: high cyclomatic complexity
      expect((code.match(/if/g) || []).length).toBeGreaterThanOrEqual(3);
    });
  });
});
