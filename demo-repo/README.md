# CodeCrypt Demo Repository

This repository contains intentional code quality issues to demonstrate CodeCrypt's haunting detection capabilities.

## 🎃 What's Inside

This demo showcases all 5 types of "hauntings" that CodeCrypt can detect:

### 👻 Ghosts (Dead Code)
- Unused variables
- Unused functions
- Unreferenced code

### 🧟 Zombies (Deprecated Patterns)
- `var` declarations (should use `const`/`let`)
- `new Buffer()` (should use `Buffer.from()`)
- Deprecated APIs

### 🧛 Vampires (Performance Issues)
- Nested loops (O(n²) or worse)
- Synchronous file operations
- Inefficient algorithms

### 💀 Skeletons (Missing Documentation)
- Functions without JSDoc
- Classes without documentation
- Undocumented public APIs

### 👹 Monsters (High Complexity)
- Functions with cyclomatic complexity > 10
- Deeply nested conditionals
- Hard-to-maintain code

## 📊 Expected Results

When you scan this repository with CodeCrypt, you should see:
- **Haunting Level**: Severely Cursed
- **Total Issues**: 20+
- Multiple issues of each type

## 🚀 How to Use

1. Connect this repository to CodeCrypt
2. Run a scan
3. Explore the haunted visualization
4. Click on issues to see AI-generated explanations
5. Learn how to fix each type of issue

## 📝 Note

All issues in this repository are **intentional** for demonstration purposes. This is not production code!
