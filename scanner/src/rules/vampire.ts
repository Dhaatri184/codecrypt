import { Rule, RuleContext, DetectedIssue } from './types';
import { parser } from '../parser';

// Vampire Rule: Detects performance issues
export class VampireRule implements Rule {
  id = 'vampire-performance';
  hauntingType = 'vampire' as const;
  private currentFilePath: string = '';

  detect(context: RuleContext): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    this.currentFilePath = context.filePath;

    try {
      this.detectPerformanceIssues(context.ast, context.content, issues);
    } catch (error) {
      // Silently fail for this rule
    }

    return issues;
  }

  private detectPerformanceIssues(node: any, content: string, issues: DetectedIssue[]): void {
    if (!node) return;

    // Detect nested loops
    if (node.type === 'ForStatement' || node.type === 'WhileStatement') {
      const nestedLoops = this.countNestedLoops(node);
      if (nestedLoops >= 2) {
        const loc = node.loc!;
        issues.push({
          hauntingType: 'vampire',
          severity: nestedLoops >= 3 ? 'high' : 'medium',
          filePath: this.currentFilePath,
          startLine: loc.start.line,
          endLine: loc.end.line,
          codeSnippet: parser.extractCodeSnippet(content, loc.start.line, loc.end.line),
          ruleId: 'vampire-nested-loops',
          message: `Nested loops detected (depth: ${nestedLoops}) - potential O(n^${nestedLoops}) complexity`,
        });
      }
    }

    // Detect array operations in loops
    if (node.type === 'ForStatement' || node.type === 'WhileStatement') {
      if (this.hasArrayOperationsInLoop(node)) {
        const loc = node.loc!;
        issues.push({
          hauntingType: 'vampire',
          severity: 'medium',
          filePath: this.currentFilePath,
          startLine: loc.start.line,
          endLine: loc.end.line,
          codeSnippet: parser.extractCodeSnippet(content, loc.start.line, Math.min(loc.start.line + 10, loc.end.line)),
          ruleId: 'vampire-array-in-loop',
          message: 'Array operations inside loop may cause performance issues',
        });
      }
    }

    // Detect synchronous operations that should be async
    if (node.type === 'CallExpression' && node.callee) {
      const calleeName = this.getCalleeName(node.callee);
      if (this.isSyncFileOperation(calleeName)) {
        const loc = node.loc!;
        issues.push({
          hauntingType: 'vampire',
          severity: 'high',
          filePath: this.currentFilePath,
          startLine: loc.start.line,
          endLine: loc.end.line,
          codeSnippet: parser.extractCodeSnippet(content, loc.start.line, loc.end.line),
          ruleId: 'vampire-sync-operation',
          message: `Synchronous operation '${calleeName}' blocks the event loop`,
        });
      }
    }

    // Recursively visit children
    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => this.detectPerformanceIssues(c, content, issues));
      } else if (child && typeof child === 'object') {
        this.detectPerformanceIssues(child, content, issues);
      }
    }
  }

  private countNestedLoops(node: any, depth: number = 0): number {
    if (!node) return depth;

    let maxDepth = depth;

    if (node.type === 'ForStatement' || node.type === 'WhileStatement' || node.type === 'DoWhileStatement') {
      maxDepth = depth + 1;
    }

    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => {
          const childDepth = this.countNestedLoops(c, maxDepth);
          if (childDepth > maxDepth) maxDepth = childDepth;
        });
      } else if (child && typeof child === 'object') {
        const childDepth = this.countNestedLoops(child, maxDepth);
        if (childDepth > maxDepth) maxDepth = childDepth;
      }
    }

    return maxDepth;
  }

  private hasArrayOperationsInLoop(node: any): boolean {
    if (!node) return false;

    if (node.type === 'CallExpression' && node.callee) {
      const calleeName = this.getCalleeName(node.callee);
      if (['push', 'pop', 'shift', 'unshift', 'splice', 'concat'].includes(calleeName)) {
        return true;
      }
    }

    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        if (child.some(c => this.hasArrayOperationsInLoop(c))) return true;
      } else if (child && typeof child === 'object') {
        if (this.hasArrayOperationsInLoop(child)) return true;
      }
    }

    return false;
  }

  private isSyncFileOperation(name: string): boolean {
    const syncOps = [
      'readFileSync',
      'writeFileSync',
      'appendFileSync',
      'existsSync',
      'statSync',
      'readdirSync',
    ];
    return syncOps.includes(name);
  }

  private getCalleeName(callee: any): string {
    if (callee.type === 'Identifier') {
      return callee.name;
    }
    if (callee.type === 'MemberExpression' && callee.property) {
      return callee.property.name || '';
    }
    return '';
  }
}

export const vampireRule = new VampireRule();
