import { Rule, RuleContext, DetectedIssue } from './types';
import { parser } from '../parser';

// Skeleton Rule: Detects missing tests and documentation
export class SkeletonRule implements Rule {
  id = 'skeleton-missing-docs';
  hauntingType = 'skeleton' as const;
  private currentFilePath: string = '';

  detect(context: RuleContext): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    this.currentFilePath = context.filePath;

    try {
      this.checkDocumentation(context.ast, context.content, context.filePath, issues);
    } catch (error) {
      // Silently fail for this rule
    }

    return issues;
  }

  private checkDocumentation(
    node: any,
    content: string,
    filePath: string,
    issues: DetectedIssue[]
  ): void {
    if (!node) return;

    // Check for functions without JSDoc
    if (
      (node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression') &&
      node.loc
    ) {
      const hasJSDoc = this.hasJSDocComment(node, content);
      
      if (!hasJSDoc && this.isPublicFunction(node)) {
        const loc = node.loc!;
        const functionName = this.getFunctionName(node);
        
        issues.push({
          hauntingType: 'skeleton',
          severity: 'low',
          filePath: this.currentFilePath,
          startLine: loc.start.line,
          endLine: loc.end.line,
          codeSnippet: parser.extractCodeSnippet(content, loc.start.line, loc.end.line),
          ruleId: this.id,
          message: `Function '${functionName}' is missing documentation`,
        });
      }
    }

    // Check for classes without JSDoc
    if (node.type === 'ClassDeclaration' && node.loc) {
      const hasJSDoc = this.hasJSDocComment(node, content);
      
      if (!hasJSDoc) {
        const loc = node.loc!;
        const className = node.id ? node.id.name : '<anonymous>';
        
        issues.push({
          hauntingType: 'skeleton',
          severity: 'medium',
          filePath: this.currentFilePath,
          startLine: loc.start.line,
          endLine: loc.end.line,
          codeSnippet: parser.extractCodeSnippet(content, loc.start.line, Math.min(loc.start.line + 5, loc.end.line)),
          ruleId: 'skeleton-missing-class-docs',
          message: `Class '${className}' is missing documentation`,
        });
      }
    }

    // Recursively visit children
    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => this.checkDocumentation(c, content, filePath, issues));
      } else if (child && typeof child === 'object') {
        this.checkDocumentation(child, content, filePath, issues);
      }
    }
  }

  private hasJSDocComment(node: any, content: string): boolean {
    if (!node.loc) return false;

    const lines = content.split('\n');
    const startLine = node.loc.start.line;

    // Check a few lines before the node for JSDoc comment
    for (let i = Math.max(0, startLine - 5); i < startLine; i++) {
      const line = lines[i];
      if (line && (line.includes('/**') || line.includes('*/'))) {
        return true;
      }
    }

    return false;
  }

  private isPublicFunction(node: any): boolean {
    // Consider exported functions as public
    let current = node;
    while (current) {
      if (
        current.type === 'ExportNamedDeclaration' ||
        current.type === 'ExportDefaultDeclaration'
      ) {
        return true;
      }
      current = current.parent;
    }

    // Functions with names starting with _ are considered private
    const name = this.getFunctionName(node);
    return !name.startsWith('_');
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

export const skeletonRule = new SkeletonRule();
