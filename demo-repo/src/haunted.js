// CodeCrypt Demo - Intentional Code Issues
// This file contains examples of all 5 haunting types

// ============================================
// 👻 GHOST - Dead Code (Unused Variables/Functions)
// ============================================

const unusedVariable = "I'm never used anywhere";
const anotherDeadVariable = 42;

function unusedFunction() {
  return "Nobody calls me";
}

function anotherUnusedFunction(param) {
  console.log(param);
}

// ============================================
// 🧟 ZOMBIE - Deprecated Patterns
// ============================================

// Using 'var' instead of 'const'/'let'
var oldStyleVariable = 1;
var anotherOldVar = "deprecated";

// Deprecated Buffer constructor
const buffer = new Buffer('test');

// Using arguments object
function oldStyleArgs() {
  return arguments[0];
}

// ============================================
// 🧛 VAMPIRE - Performance Issues
// ============================================

// Nested loops - O(n³) complexity!
function nestedLoopsExample(n, m, p) {
  const results = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < p; k++) {
        results.push(i * j * k);
      }
    }
  }
  return results;
}

// Array operations in loop
function inefficientLoop(items) {
  const result = [];
  for (let i = 0; i < items.length; i++) {
    result.push(items[i]);
    result.push(items[i] * 2);
  }
  return result;
}

// Synchronous file operation (if this were real Node.js code)
// const fs = require('fs');
// const data = fs.readFileSync('file.txt');

// ============================================
// 💀 SKELETON - Missing Documentation
// ============================================

// No JSDoc comment!
export function publicAPI(param1, param2) {
  return param1 + param2;
}

// No documentation for this class
export class UndocumentedClass {
  constructor(value) {
    this.value = value;
  }

  process() {
    return this.value * 2;
  }
}

// No documentation
function complexBusinessLogic(data, options) {
  if (options.mode === 'fast') {
    return data.map(x => x * 2);
  } else {
    return data.reduce((acc, x) => acc + x, 0);
  }
}

// ============================================
// 👹 MONSTER - High Complexity
// ============================================

// Cyclomatic complexity > 10
function monsterComplexity(a, b, c, d, e, f) {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          if (e) {
            if (f) {
              for (let i = 0; i < 10; i++) {
                if (i % 2 === 0) {
                  if (i > 5) {
                    return true;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return false;
}

// Another complex function
function anotherMonster(input) {
  if (input.type === 'A') {
    if (input.value > 10) {
      if (input.enabled) {
        return processTypeA(input);
      } else {
        return defaultA();
      }
    } else {
      if (input.special) {
        return specialA();
      }
    }
  } else if (input.type === 'B') {
    if (input.value < 5) {
      return processTypeB(input);
    } else {
      if (input.flag) {
        return flaggedB();
      }
    }
  } else {
    if (input.fallback) {
      return fallbackProcess();
    }
  }
  return null;
}

// Helper functions (also undocumented - more skeletons!)
function processTypeA(input) { return input.value; }
function defaultA() { return 0; }
function specialA() { return -1; }
function processTypeB(input) { return input.value * 2; }
function flaggedB() { return 100; }
function fallbackProcess() { return null; }

// ============================================
// BONUS: Multiple Issues in One Function
// ============================================

var globalCounter = 0; // Zombie (var)

// No documentation (Skeleton)
function multipleIssues(data) { // Monster (high complexity)
  var result = []; // Zombie (var)
  
  // Vampire (nested loops)
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data.length; j++) {
      if (i !== j) {
        if (data[i] > data[j]) {
          if (data[i] % 2 === 0) {
            result.push(data[i]);
          }
        }
      }
    }
  }
  
  return result;
}

// Ghost - this is never exported or used
const secretValue = "hidden";
