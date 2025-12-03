import { HauntingType } from '@codecrypt/shared';

export interface ExplanationTemplate {
  explanation: string;
  impact: string;
  fixSuggestion: string;
  codeExample?: string;
}

export const explanationTemplates: Record<HauntingType, (message: string) => ExplanationTemplate> = {
  ghost: (message: string) => ({
    explanation: `This code is dead - it's defined but never used in your application. ${message}`,
    impact: 'Dead code increases bundle size, makes the codebase harder to maintain, and can confuse other developers.',
    fixSuggestion: 'Remove this unused code. If you think you might need it later, rely on version control (git) to retrieve it.',
    codeExample: '// Simply delete the unused code\n// Git history will preserve it if needed',
  }),

  zombie: (message: string) => ({
    explanation: `This code uses deprecated patterns or APIs that are no longer recommended. ${message}`,
    impact: 'Deprecated code may stop working in future versions, has known issues, or better alternatives exist.',
    fixSuggestion: 'Update to the modern equivalent. Check the deprecation notice for the recommended replacement.',
    codeExample: '// Old: var x = 1;\n// New: const x = 1;\n\n// Old: new Buffer()\n// New: Buffer.from()',
  }),

  vampire: (message: string) => ({
    explanation: `This code has performance issues that drain your application's resources. ${message}`,
    impact: 'Performance problems lead to slow response times, high CPU usage, and poor user experience.',
    fixSuggestion: 'Optimize the algorithm, reduce nesting, use async operations, or cache results.',
    codeExample: '// Avoid nested loops\n// Use efficient data structures\n// Consider memoization',
  }),

  skeleton: (message: string) => ({
    explanation: `This code lacks proper documentation or test coverage. ${message}`,
    impact: 'Undocumented code is hard to understand and maintain. Missing tests make refactoring risky.',
    fixSuggestion: 'Add JSDoc comments explaining what the code does, its parameters, and return values. Write tests to verify behavior.',
    codeExample: '/**\n * Description of what this function does\n * @param {type} param - Description\n * @returns {type} Description\n */\nfunction example(param) {\n  // implementation\n}',
  }),

  monster: (message: string) => ({
    explanation: `This code is too complex with high cyclomatic complexity. ${message}`,
    impact: 'Complex code is difficult to understand, test, and maintain. It\'s more likely to contain bugs.',
    fixSuggestion: 'Break this function into smaller, focused functions. Extract conditional logic into separate functions. Use early returns to reduce nesting.',
    codeExample: '// Instead of deeply nested ifs:\nif (condition1) {\n  if (condition2) {\n    // ...\n  }\n}\n\n// Use early returns:\nif (!condition1) return;\nif (!condition2) return;\n// ...',
  }),
};

export function generateExplanation(
  hauntingType: HauntingType,
  message: string
): ExplanationTemplate {
  const generator = explanationTemplates[hauntingType];
  return generator(message);
}
