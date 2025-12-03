import { Rule, RuleContext, DetectedIssue } from './types';
import { parser } from '../parser';

// Monster Rule: Detects high complexity functions
export class MonsterRule implements Rule {
  id = 'monster-complexity';
  hauntingType = 'monster' as const;
  private complexityThreshold = 10;
  private currentFilePath: string = '';

  detect(context: RuleContext): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    this.currentFilePath = context.filePath;

    try {
      this.analyzeFunctions(context.ast, context.content, issues);
    } catch (error) {
      // Silently fail for this rule
    }

    return issues;
  }

  private analyzeFunctions(node: any, content: string, issues: DetectedIssue[]): void {
    if (!node) return;

    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    ) {
      const complexity = this.calculateComplexity(node);
      
      if (complexity > this.complexityThreshold) {
        const loc = node.loc!;
        const functionName = this.getFunctionName(node);
        
        issues.push({
          hauntingType: 'monster',
          severity: complexity > 20 ? 'critical' : complexity > 15 ? 'high' : 'medium',
          filePath: this.currentFilePath,
          startLine: loc.start.line,
          endLine: loc.end.line,
          codeSnippet: parser.extractCodeSnippet(content, loc.start.line, loc.end.line),
          ruleId: this.id,
          message: `Function '${functionName}' has cyclomatic complexity of ${complexity} (threshold: ${this.complexityThreshold})`,
        });
      }
    }

    // Recursively visit children
    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => this.analyzeFunctions(c, content, issues));
      } else if (child && typeof child === 'object') {
        this.analyzeFunctions(child, content, issues);
      }
    }
  }

  private calculateComplexity(node: any): number {
    let complexity = 1; // Base complexity

    const countComplexity = (n: any): void => {
      if (!n) return;

      // Increment complexity for decision points
      if (
        n.type === 'IfStatement' ||
        n.type === 'ForStatement' ||
        n.type === 'WhileStatement' ||
        n.type === 'DoWhileStatement' ||
        n.type === 'SwitchCase' ||
        n.type === 'ConditionalExpression' ||
        n.type === 'LogicalExpression' && (n.operator === '&&' || n.operator === '||') ||
        n.type === 'CatchClause'
      ) {
        complexity++;
      }

      // Recursively count in children
      for (const key in n) {
        if (key === 'parent' || key === 'loc' || key === 'range') continue;
        const child = n[key];
        if (Array.isArray(child)) {
          child.forEach(countComplexity);
        } else if (child && typeof child === 'object') {
          countComplexity(child);
        }
      }
    };

    countComplexity(node.body);
    return complexity;
  }

  private getFunctionName(node: any): string {
    if (node.id && node.id.name) {
      return node.id.name;
    }
    if (node.parent && node.parent.type === 'VariableDeclarator' && node.parent.id) {
      return node.parent.id.name;
    }
    return '<anonymous>';
  }
}

export const monsterRule = new MonsterRule();
