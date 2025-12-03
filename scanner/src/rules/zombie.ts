import { Rule, RuleContext, DetectedIssue } from './types';
import { parser } from '../parser';

// Zombie Rule: Detects deprecated dependencies and patterns
// OPTIMIZED: Combined pattern matching and AST traversal
export class ZombieRule implements Rule {
  id = 'zombie-deprecated';
  hauntingType = 'zombie' as const;
  private currentFilePath: string = '';

  // Pre-compiled patterns for better performance
  private deprecatedPatterns = [
    { pattern: /var\s+/, message: 'Use of "var" is deprecated, use "const" or "let"' },
    { pattern: /arguments\[/, message: 'Use of "arguments" object is deprecated, use rest parameters' },
    { pattern: /new\s+Buffer\(/, message: 'Buffer() constructor is deprecated, use Buffer.from()' },
    { pattern: /\.substr\(/, message: 'String.substr() is deprecated, use String.substring()' },
  ];

  // Pre-built lookup for O(1) access
  private deprecatedAPIs: Record<string, { alternative: string }> = {
    'fs.exists': { alternative: 'Use fs.stat() or fs.access() instead' },
    'domain.create': { alternative: 'Use async_hooks or error handling instead' },
    'crypto.createCipher': { alternative: 'Use crypto.createCipheriv() instead' },
    'crypto.createDecipher': { alternative: 'Use crypto.createDecipheriv() instead' },
    'url.parse': { alternative: 'Use new URL() constructor instead' },
    'punycode': { alternative: 'Use built-in URL API instead' },
  };

  detect(context: RuleContext): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    this.currentFilePath = context.filePath;

    try {
      // OPTIMIZED: Check patterns line by line (faster than full regex on entire content)
      const lines = context.content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const { pattern, message } of this.deprecatedPatterns) {
          if (pattern.test(line)) {
            issues.push({
              hauntingType: 'zombie',
              severity: 'low',
              filePath: context.filePath,
              startLine: i + 1,
              endLine: i + 1,
              codeSnippet: line.trim(),
              ruleId: this.id,
              message,
            });
            break; // Only report one issue per line
          }
        }
      }

      // Check for deprecated Node.js APIs via AST
      this.detectDeprecatedAPIs(context.ast, context.content, issues);
    } catch (error) {
      // Silently fail for this rule
    }

    return issues;
  }

  // OPTIMIZED: Single traversal with early exit
  private detectDeprecatedAPIs(node: any, content: string, issues: DetectedIssue[]): void {
    if (!node || typeof node !== 'object') return;

    // Check if this is a call expression
    if (node.type === 'CallExpression' && node.callee) {
      const apiName = this.getAPIName(node.callee);
      const deprecatedAPI = this.deprecatedAPIs[apiName]; // O(1) lookup
      
      if (deprecatedAPI) {
        const loc = node.loc!;
        issues.push({
          hauntingType: 'zombie',
          severity: 'medium',
          filePath: this.currentFilePath,
          startLine: loc.start.line,
          endLine: loc.end.line,
          codeSnippet: parser.extractCodeSnippet(content, loc.start.line, loc.end.line),
          ruleId: 'zombie-deprecated-api',
          message: `${apiName} is deprecated. ${deprecatedAPI.alternative}`,
        });
      }
    }

    // Recursively visit children (optimized iteration)
    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          this.detectDeprecatedAPIs(item, content, issues);
        }
      } else if (child && typeof child === 'object') {
        this.detectDeprecatedAPIs(child, content, issues);
      }
    }
  }

  private getAPIName(callee: any): string {
    if (callee.type === 'Identifier') {
      return callee.name;
    }
    if (callee.type === 'MemberExpression') {
      const object = this.getAPIName(callee.object);
      const property = callee.property?.name || '';
      return object ? `${object}.${property}` : property;
    }
    return '';
  }
}

export const zombieRule = new ZombieRule();
