import { TSESTree } from '@typescript-eslint/types';
import { Rule, RuleContext, DetectedIssue } from './types';
import { parser } from '../parser';

// Ghost Rule: Detects dead code (unused variables, functions, imports)
// OPTIMIZED: Single-pass traversal instead of two passes
export class GhostRule implements Rule {
  id = 'ghost-dead-code';
  hauntingType = 'ghost' as const;

  detect(context: RuleContext): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    try {
      // Track declared and used identifiers in a single pass
      const declared = new Map<string, { node: TSESTree.Node; isExported: boolean }>();
      const used = new Set<string>();
      const imports = new Map<string, TSESTree.ImportSpecifier>();

      // Single optimized pass
      this.analyzeAST(context.ast, declared, used, imports);

      // Find unused declarations (excluding exports)
      for (const [name, { node, isExported }] of declared.entries()) {
        if (!used.has(name) && !isExported) {
          const loc = node.loc!;
          issues.push({
            hauntingType: 'ghost',
            severity: 'medium',
            filePath: context.filePath,
            startLine: loc.start.line,
            endLine: loc.end.line,
            codeSnippet: parser.extractCodeSnippet(
              context.content,
              loc.start.line,
              loc.end.line
            ),
            ruleId: this.id,
            message: `Unused ${this.getNodeType(node)} '${name}' is dead code`,
          });
        }
      }

      // Find unused imports
      for (const [name, specifier] of imports.entries()) {
        if (!used.has(name)) {
          const loc = specifier.loc!;
          issues.push({
            hauntingType: 'ghost',
            severity: 'low',
            filePath: context.filePath,
            startLine: loc.start.line,
            endLine: loc.end.line,
            codeSnippet: parser.extractCodeSnippet(
              context.content,
              loc.start.line,
              loc.end.line
            ),
            ruleId: 'ghost-unused-import',
            message: `Unused import '${name}'`,
          });
        }
      }
    } catch (error) {
      // Silently fail for this rule
    }

    return issues;
  }

  // OPTIMIZED: Single pass that collects both declarations and usages
  private analyzeAST(
    node: any,
    declared: Map<string, { node: TSESTree.Node; isExported: boolean }>,
    used: Set<string>,
    imports: Map<string, TSESTree.ImportSpecifier>,
    inExport = false
  ): void {
    if (!node || typeof node !== 'object') return;

    const isExportNode = node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration';

    // Collect declarations
    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier') {
      declared.set(node.id.name, { node, isExported: inExport });
    } else if (node.type === 'FunctionDeclaration' && node.id) {
      declared.set(node.id.name, { node, isExported: inExport });
    } else if (node.type === 'ImportDeclaration') {
      // Collect imports
      for (const specifier of node.specifiers) {
        imports.set(specifier.local.name, specifier);
      }
    }

    // Collect usages (but not in declaration position)
    if (node.type === 'Identifier' && node.name && !this.isDeclarationContext(node)) {
      used.add(node.name);
    }

    // Recursively visit children (optimized iteration)
    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          this.analyzeAST(item, declared, used, imports, inExport || isExportNode);
        }
      } else if (child && typeof child === 'object') {
        this.analyzeAST(child, declared, used, imports, inExport || isExportNode);
      }
    }
  }

  private isDeclarationContext(node: any): boolean {
    // Skip identifiers that are in declaration position
    const parent = node.parent;
    if (!parent) return false;
    
    return (
      (parent.type === 'VariableDeclarator' && parent.id === node) ||
      (parent.type === 'FunctionDeclaration' && parent.id === node) ||
      (parent.type === 'ImportSpecifier' && parent.local === node)
    );
  }

  private getNodeType(node: any): string {
    if (node.type === 'VariableDeclarator') return 'variable';
    if (node.type === 'FunctionDeclaration') return 'function';
    return 'identifier';
  }
}

export const ghostRule = new GhostRule();
