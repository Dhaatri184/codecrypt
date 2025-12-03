/**
 * Scanner-specific test data generators for property-based testing
 * Uses fast-check library to generate random test data
 */

import * as fc from 'fast-check';

/**
 * Generate file paths
 */
export const filePathArb = fc.oneof(
  fc.constant('src/index.ts'),
  fc.constant('src/utils/helper.js'),
  fc.constant('test/example.test.ts'),
  fc.constant('lib/module.py'),
  fc.constant('app/Main.java'),
  fc.constant('src/component.cpp'),
  fc.constant('models/User.cs'),
  fc.constant('handlers/api.go'),
  fc.constant('controllers/home.rb'),
  fc.constant('views/index.php')
);

/**
 * Generate file content (text)
 */
export const fileContentArb = fc.string({ minLength: 0, maxLength: 10000 });

/**
 * Generate binary file indicators
 */
export const binaryFileArb = fc.record({
  path: filePathArb,
  isBinary: fc.boolean(),
  content: fc.oneof(
    fileContentArb,
    fc.uint8Array({ minLength: 0, maxLength: 1000 })
  ),
});

/**
 * Generate code with potential syntax errors
 */
export const codeWithErrorsArb = fc.oneof(
  fc.constant('function test() { return 42; }'), // Valid
  fc.constant('function test() { return 42; '), // Missing closing brace
  fc.constant('const x = ;'), // Syntax error
  fc.constant('if (true) { console.log("test") }'), // Valid
  fc.constant('for (let i = 0; i < 10; i++) { }'), // Valid
  fc.constant('class Test { constructor() { } }'), // Valid
  fc.constant('import { something } from "module"'), // Valid
  fc.constant('const x = { a: 1, b: 2 }'), // Valid
);

/**
 * Generate repository metadata
 */
export const repositoryArb = fc.record({
  url: fc.webUrl(),
  branch: fc.oneof(fc.constant('main'), fc.constant('master'), fc.constant('develop')),
  size: fc.nat(1000000), // Size in KB
  fileCount: fc.nat(10000),
});

/**
 * Generate scan results
 */
export const scanResultArb = fc.record({
  filePath: filePathArb,
  issues: fc.array(
    fc.record({
      type: fc.oneof(
        fc.constant('monster'),
        fc.constant('zombie'),
        fc.constant('ghost')
      ),
      line: fc.nat(1000),
      column: fc.nat(100),
      message: fc.string({ minLength: 10, maxLength: 200 }),
      severity: fc.oneof(
        fc.constant('low'),
        fc.constant('medium'),
        fc.constant('high')
      ),
    }),
    { maxLength: 50 }
  ),
});

/**
 * Generate AST node types
 */
export const astNodeTypeArb = fc.oneof(
  fc.constant('FunctionDeclaration'),
  fc.constant('ClassDeclaration'),
  fc.constant('VariableDeclaration'),
  fc.constant('IfStatement'),
  fc.constant('ForStatement'),
  fc.constant('WhileStatement'),
  fc.constant('ReturnStatement'),
  fc.constant('CallExpression'),
  fc.constant('BinaryExpression')
);

/**
 * Generate file discovery results
 */
export const fileDiscoveryArb = fc.record({
  totalFiles: fc.nat(10000),
  textFiles: fc.nat(10000),
  binaryFiles: fc.nat(1000),
  skippedFiles: fc.nat(100),
}).filter(({ totalFiles, textFiles, binaryFiles, skippedFiles }) => 
  textFiles + binaryFiles + skippedFiles <= totalFiles
);
