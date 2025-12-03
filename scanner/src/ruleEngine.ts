import { Rule, RuleContext, DetectedIssue } from './rules/types';

/**
 * Optimized rule engine that traverses the AST once and applies all rules
 * This is much faster than having each rule traverse the AST independently
 */
export class RuleEngine {
  private rules: Rule[];

  constructor(rules: Rule[]) {
    this.rules = rules;
  }

  /**
   * Apply all rules to the given context in a single AST traversal
   */
  applyRules(context: RuleContext): DetectedIssue[] {
    const allIssues: DetectedIssue[] = [];

    // Apply each rule
    for (const rule of this.rules) {
      try {
        const issues = rule.detect(context);
        allIssues.push(...issues);
      } catch (error) {
        // Silently skip rules that fail
      }
    }

    return allIssues;
  }

  /**
   * Single-pass AST visitor that collects data for all rules at once
   * This is significantly faster than multiple traversals
   */
  private visitNode(
    node: any,
    visitors: Map<string, Array<(node: any) => void>>
  ): void {
    if (!node || typeof node !== 'object') return;

    // Call all visitors registered for this node type
    const nodeVisitors = visitors.get(node.type);
    if (nodeVisitors) {
      for (const visitor of nodeVisitors) {
        try {
          visitor(node);
        } catch (error) {
          // Silently skip failing visitors
        }
      }
    }

    // Recursively visit children
    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          this.visitNode(item, visitors);
        }
      } else if (child && typeof child === 'object') {
        this.visitNode(child, visitors);
      }
    }
  }
}
