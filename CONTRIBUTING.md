# Contributing to CodeCrypt

Thank you for your interest in contributing to CodeCrypt! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git
- GitHub account

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/yourusername/codecrypt.git
cd codecrypt
```

3. Install dependencies:
```bash
npm install
```

4. Copy environment variables:
```bash
cp .env.example .env
```

5. Start development environment:
```bash
docker-compose up
```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

Example: `feature/add-python-support`

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

Example:
```
feat(scanner): add Python language support

Implements AST parsing for Python files using ast module.
Adds detection rules for Python-specific issues.

Closes #123
```

### Pull Request Process

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Commit your changes
7. Push to your fork
8. Create a Pull Request

### PR Guidelines

- Provide clear description of changes
- Reference related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed
- Keep PRs focused and reasonably sized

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Provide type annotations
- Avoid `any` type

### Formatting

- Use Prettier for formatting
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas

### Naming Conventions

- `camelCase` for variables and functions
- `PascalCase` for classes and types
- `UPPER_SNAKE_CASE` for constants
- Descriptive names over short names

## Testing

### Unit Tests

- Write tests for all new features
- Use Jest for testing
- Aim for > 80% coverage
- Test edge cases

Example:
```typescript
describe('canExorcise', () => {
  it('should return true for unused imports', () => {
    const issue = createIssue({ ruleId: 'unused-import' });
    expect(canExorcise(issue)).toBe(true);
  });
});
```

### Property-Based Tests

- Use fast-check for property tests
- Test universal properties
- Run 100+ iterations

Example:
```typescript
test('branch names should follow convention', () => {
  fc.assert(
    fc.property(
      fc.record({ id: fc.uuid(), hauntingType: fc.constantFrom(...) }),
      (issue) => {
        const branch = generateBranchName(issue);
        return branch.startsWith('codecrypt/fix-');
      }
    ),
    { numRuns: 100 }
  );
});
```

## Adding New Features

### New Haunting Type

1. Add type to `packages/shared/src/types.ts`
2. Create detection rule in `scanner/src/rules/`
3. Add icon to frontend
4. Update documentation

### New Detection Rule

1. Create rule file in `scanner/src/rules/`
2. Implement detection logic
3. Add tests
4. Update `RULES.md` documentation

### New API Endpoint

1. Add route in `backend/src/routes/`
2. Implement handler
3. Add authentication if needed
4. Write tests
5. Update `API.md` documentation

## Documentation

- Update README for major changes
- Add JSDoc comments to functions
- Update API docs for endpoint changes
- Add examples for new features

## Questions?

- Open an issue for bugs
- Start a discussion for questions
- Join our Discord for chat

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
