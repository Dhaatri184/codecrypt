# Haunting Detection Rules

This document describes the code quality rules used by CodeCrypt to detect different types of "hauntings" in your codebase.

## 👻 Ghost Hauntings (Dead Code)

Ghosts represent code that exists but serves no purpose - dead code that haunts your codebase.

### Rules

#### G001: Unused Variables
**Severity:** Low  
**Description:** Variables declared but never used  
**Example:**
```typescript
function calculate(x: number, y: number) {
  const unused = 10; // Ghost!
  return x + y;
}
```
**Fix:** Remove the unused variable

#### G002: Unused Functions
**Severity:** Medium  
**Description:** Functions defined but never called  
**Example:**
```typescript
function helperFunction() { // Ghost!
  return "never called";
}

export function main() {
  return "main logic";
}
```
**Fix:** Remove the unused function or export it if needed

#### G003: Unused Imports
**Severity:** Low  
**Description:** Imported modules that are never used  
**Example:**
```typescript
import { useState, useEffect } from 'react'; // useEffect is a ghost!

function Component() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```
**Fix:** Remove unused imports

#### G004: Unreachable Code
**Severity:** High  
**Description:** Code that can never be executed  
**Example:**
```typescript
function process(value: number) {
  return value * 2;
  console.log('This will never run'); // Ghost!
}
```
**Fix:** Remove unreachable code or fix control flow

## 🧟 Zombie Hauntings (Deprecated Code)

Zombies represent code that should be dead but keeps shambling along - deprecated dependencies and legacy patterns.

### Rules

#### Z001: Deprecated Dependencies
**Severity:** Medium  
**Description:** npm packages with newer versions available  
**Detection:** Checks package.json against npm registry  
**Example:**
```json
{
  "dependencies": {
    "react": "16.8.0" // Zombie! Current is 18.x
  }
}
```
**Fix:** Update to latest stable version

#### Z002: Deprecated API Usage
**Severity:** High  
**Description:** Using deprecated APIs or methods  
**Example:**
```typescript
// Zombie! componentWillMount is deprecated
class MyComponent extends React.Component {
  componentWillMount() {
    this.setState({ loaded: true });
  }
}
```
**Fix:** Use modern alternatives (useEffect hook)

#### Z003: Legacy Patterns
**Severity:** Medium  
**Description:** Outdated coding patterns  
**Example:**
```typescript
// Zombie! var is legacy
var x = 10;

// Modern: use const or let
const x = 10;
```
**Fix:** Update to modern JavaScript/TypeScript patterns

## 🧛 Vampire Hauntings (Performance Issues)

Vampires drain the life from your application - performance issues that suck resources.

### Rules

#### V001: Nested Loops
**Severity:** High  
**Description:** Nested loops with O(n²) or worse complexity  
**Example:**
```typescript
// Vampire! O(n²) complexity
function findDuplicates(arr: number[]) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}
```
**Fix:** Use Set for O(n) complexity

#### V002: Memory Leaks
**Severity:** Critical  
**Description:** Event listeners or subscriptions not cleaned up  
**Example:**
```typescript
// Vampire! Memory leak
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Missing cleanup!
}, []);
```
**Fix:** Add cleanup function
```typescript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

#### V003: Inefficient Algorithms
**Severity:** High  
**Description:** Using inefficient algorithms when better options exist  
**Example:**
```typescript
// Vampire! Inefficient search
function contains(arr: number[], target: number) {
  return arr.indexOf(target) !== -1; // O(n) every time
}
```
**Fix:** Use Set for O(1) lookups

#### V004: Large Bundle Size
**Severity:** Medium  
**Description:** Importing entire libraries when only using small parts  
**Example:**
```typescript
// Vampire! Imports entire lodash
import _ from 'lodash';
_.debounce(fn, 300);
```
**Fix:** Import only what you need
```typescript
import debounce from 'lodash/debounce';
```

## 💀 Skeleton Hauntings (Missing Coverage)

Skeletons represent the bare bones - code lacking proper documentation and tests.

### Rules

#### S001: Missing JSDoc
**Severity:** Low  
**Description:** Functions without documentation comments  
**Example:**
```typescript
// Skeleton! No documentation
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```
**Fix:** Add JSDoc comments
```typescript
/**
 * Calculates the total price of all items
 * @param items - Array of items to sum
 * @returns Total price
 */
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

#### S002: Missing Tests
**Severity:** Medium  
**Description:** Source files without corresponding test files  
**Detection:** Checks for .test.ts or .spec.ts files  
**Example:**
```
src/
  utils/
    calculator.ts  // Skeleton! No test file
```
**Fix:** Create calculator.test.ts

#### S003: Low Test Coverage
**Severity:** Medium  
**Description:** Functions with no test coverage  
**Detection:** Analyzes test coverage reports  
**Fix:** Write tests for uncovered code

## 👹 Monster Hauntings (High Complexity)

Monsters represent code that has grown out of control - high complexity that's hard to understand and maintain.

### Rules

#### M001: High Cyclomatic Complexity
**Severity:** High  
**Description:** Functions with complexity score > 10  
**Example:**
```typescript
// Monster! Complexity = 15
function processOrder(order: Order) {
  if (order.type === 'standard') {
    if (order.priority === 'high') {
      if (order.amount > 1000) {
        // ... many more nested conditions
      }
    }
  }
  // ... more branches
}
```
**Fix:** Break into smaller functions

#### M002: Long Functions
**Severity:** Medium  
**Description:** Functions with > 50 lines of code  
**Fix:** Extract smaller, focused functions

#### M003: Large Files
**Severity:** Medium  
**Description:** Files with > 500 lines of code  
**Fix:** Split into multiple modules

#### M004: Deep Nesting
**Severity:** High  
**Description:** Code with > 4 levels of nesting  
**Example:**
```typescript
// Monster! 5 levels of nesting
if (condition1) {
  if (condition2) {
    if (condition3) {
      if (condition4) {
        if (condition5) {
          // Too deep!
        }
      }
    }
  }
}
```
**Fix:** Use early returns or extract functions

#### M005: Too Many Parameters
**Severity:** Medium  
**Description:** Functions with > 5 parameters  
**Example:**
```typescript
// Monster! Too many parameters
function createUser(
  name: string,
  email: string,
  age: number,
  address: string,
  phone: string,
  role: string,
  department: string
) {
  // ...
}
```
**Fix:** Use object parameter
```typescript
interface UserData {
  name: string;
  email: string;
  age: number;
  address: string;
  phone: string;
  role: string;
  department: string;
}

function createUser(data: UserData) {
  // ...
}
```

## Severity Levels

- **Critical:** Must be fixed immediately, causes serious issues
- **High:** Should be fixed soon, significant impact
- **Medium:** Should be addressed, moderate impact
- **Low:** Nice to fix, minor impact

## Auto-Fixable Rules

The following rules can be automatically fixed via the "Exorcise" feature:

- ✅ G003: Unused Imports
- ✅ G001: Unused Variables (simple cases)
- ✅ S001: Missing JSDoc (adds template)

Other rules require manual intervention and provide AI-generated fix suggestions.

## Custom Rules

Want to add your own haunting detection rules? Check out the [Custom Rules Guide](./CUSTOM_RULES.md) to learn how to extend CodeCrypt with your own patterns.
