# CodeCrypt Design Document

## Overview

CodeCrypt is a full-stack web application that gamifies code quality analysis by visualizing technical debt as "hauntings" in a spooky interface. The system consists of five main components:

1. **Frontend Application** - React-based haunted visualization UI
2. **Backend API** - Node.js/Express REST API for orchestration
3. **Scanner Engine** - Static analysis engine for detecting code issues
4. **AI Explanation Service** - Worker service that generates human-readable explanations
5. **Database Layer** - PostgreSQL for persistent storage

The architecture follows a microservices pattern with clear separation of concerns, enabling independent scaling and development of each component.

## Architecture

### High-Level Architecture

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │ HTTPS/WSS
       ▼
┌─────────────────────────────────────┐
│       Backend API (Node.js)         │
│  ┌──────────┐      ┌─────────────┐ │
│  │   REST   │      │  WebSocket  │ │
│  │   API    │      │   Server    │ │
│  └────┬─────┘      └──────┬──────┘ │
└───────┼────────────────────┼────────┘
        │                    │
        ▼                    ▼
┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │
│   Database   │      │  (PubSub)    │
└──────────────┘      └──────────────┘
        ▲                    ▲
        │                    │
┌───────┴────────────────────┴────────┐
│         Worker Services             │
│  ┌──────────────┐  ┌──────────────┐│
│  │   Scanner    │  │  AI Service  ││
│  │   Engine     │  │   Worker     ││
│  └──────────────┘  └──────────────┘│
└─────────────────────────────────────┘
        │
        ▼
┌──────────────┐
│  GitHub API  │
└──────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Framer Motion for animations
- React Query for data fetching
- WebSocket client for real-time updates

**Backend:**
- Node.js 20+ with Express
- TypeScript for type safety
- PostgreSQL 15 for data persistence
- Redis for job queues and pub/sub
- Bull for job queue management
- Socket.io for WebSocket communication

**Scanner Engine:**
- ESLint for JavaScript/TypeScript analysis
- @typescript-eslint/parser for AST parsing
- Acorn for additional parsing capabilities
- Custom rule engine for pattern detection

**AI Service:**
- OpenAI GPT-4 API for explanations
- Anthropic Claude as fallback
- Rate limiting and caching layer

**Infrastructure:**
- Docker for containerization
- Docker Compose for local development
- GitHub Actions for CI/CD

## Components and Interfaces

### 1. Frontend Application

**Responsibilities:**
- Render haunted visualization interface
- Handle user authentication flow
- Display scan results and issue details
- Trigger scans and exorcisms
- Maintain WebSocket connection for real-time updates

**Key Components:**

```typescript
// Main visualization component
interface HauntedVisualizationProps {
  repositoryId: string;
  scanResults: ScanResults;
  onIssueClick: (issue: Issue) => void;
}

// Issue detail panel
interface IssueDetailProps {
  issue: Issue;
  explanation: AIExplanation;
  onExorcise: (issueId: string) => Promise<void>;
}

// Repository connection flow
interface RepositoryConnectorProps {
  onConnect: (repoUrl: string) => Promise<void>;
  connectedRepos: Repository[];
}
```

**API Client Interface:**

```typescript
interface CodeCryptAPI {
  // Authentication
  initiateGitHubAuth(): Promise<{ authUrl: string }>;
  handleAuthCallback(code: string): Promise<{ token: string }>;
  
  // Repository management
  listRepositories(): Promise<Repository[]>;
  connectRepository(repoId: string): Promise<void>;
  
  // Scanning
  triggerScan(repoId: string): Promise<{ scanId: string }>;
  getScanResults(scanId: string): Promise<ScanResults>;
  getScanHistory(repoId: string): Promise<ScanResults[]>;
  
  // Exorcism
  exorciseIssue(issueId: string): Promise<{ prUrl: string }>;
  
  // Real-time
  subscribeToUpdates(repoId: string, callback: (update: ScanUpdate) => void): void;
}
```

### 2. Backend API

**Responsibilities:**
- Handle HTTP requests and responses
- Orchestrate scanner and AI worker jobs
- Manage GitHub OAuth flow
- Serve scan results from database
- Broadcast real-time updates via WebSocket

**REST API Endpoints:**

```
POST   /api/auth/github/initiate
GET    /api/auth/github/callback
POST   /api/auth/logout

GET    /api/repositories
POST   /api/repositories/connect
GET    /api/repositories/:id

POST   /api/scans
GET    /api/scans/:id
GET    /api/scans/:id/results
GET    /api/repositories/:id/scans

POST   /api/issues/:id/exorcise
GET    /api/issues/:id/explanation

GET    /api/health
```

**Database Schema:**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id VARCHAR(255) UNIQUE NOT NULL,
  github_username VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Repositories table
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  github_repo_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(512) NOT NULL,
  clone_url TEXT NOT NULL,
  default_branch VARCHAR(255) DEFAULT 'main',
  last_scan_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, github_repo_id)
);

-- Scans table
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- pending, scanning, analyzing, completed, failed
  commit_sha VARCHAR(40),
  total_files INTEGER,
  total_issues INTEGER,
  haunting_level VARCHAR(50),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Issues table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  haunting_type VARCHAR(50) NOT NULL, -- ghost, zombie, vampire, skeleton, monster
  severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
  file_path TEXT NOT NULL,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  code_snippet TEXT,
  rule_id VARCHAR(255),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Explanations table
CREATE TABLE ai_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  explanation TEXT NOT NULL,
  fix_suggestion TEXT,
  code_example TEXT,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Exorcisms table
CREATE TABLE exorcisms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- pending, in_progress, completed, failed
  branch_name VARCHAR(255),
  pr_url TEXT,
  pr_number INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### 3. Scanner Engine

**Responsibilities:**
- Clone or fetch repository contents
- Parse source files into AST
- Apply static analysis rules
- Categorize issues into haunting types
- Output structured JSON results

**Core Interfaces:**

```typescript
interface ScannerConfig {
  repositoryPath: string;
  branch: string;
  filePatterns: string[];
  rules: ScanRule[];
}

interface ScanRule {
  id: string;
  hauntingType: HauntingType;
  severity: Severity;
  detect: (node: ASTNode, context: ScanContext) => Issue | null;
}

interface Issue {
  hauntingType: 'ghost' | 'zombie' | 'vampire' | 'skeleton' | 'monster';
  severity: 'low' | 'medium' | 'high' | 'critical';
  filePath: string;
  startLine: number;
  endLine: number;
  codeSnippet: string;
  ruleId: string;
  message: string;
}

interface ScanResults {
  scanId: string;
  repositoryId: string;
  commitSha: string;
  totalFiles: number;
  totalIssues: number;
  issuesByType: Record<HauntingType, number>;
  hauntingLevel: string;
  issues: Issue[];
  scannedAt: Date;
}
```

**Haunting Type Detection Rules:**

1. **Ghost (Dead Code):**
   - Unused variables, functions, imports
   - Unreachable code after return statements
   - Commented-out code blocks

2. **Zombie (Deprecated Dependencies):**
   - Outdated npm packages
   - Deprecated API usage
   - Legacy patterns

3. **Vampire (Performance Issues):**
   - Nested loops with high complexity
   - Memory leaks (event listeners not cleaned)
   - Inefficient algorithms (O(n²) or worse)
   - Large bundle sizes

4. **Skeleton (Missing Tests/Docs):**
   - Functions without JSDoc comments
   - Files without corresponding test files
   - Low test coverage areas

5. **Monster (High Complexity):**
   - Functions with cyclomatic complexity > 10
   - Files with > 500 lines
   - Deeply nested conditionals (> 4 levels)

### 4. AI Explanation Service

**Responsibilities:**
- Consume issues from job queue
- Generate human-readable explanations
- Provide fix suggestions with code examples
- Store results in database
- Handle rate limiting and retries

**Worker Interface:**

```typescript
interface AIWorkerJob {
  issueId: string;
  issue: Issue;
  codeContext: string; // Surrounding code for context
  repositoryContext: {
    language: string;
    framework?: string;
    dependencies: string[];
  };
}

interface AIExplanation {
  issueId: string;
  explanation: string;
  impact: string;
  fixSuggestion: string;
  codeExample?: string;
  references?: string[];
}

interface AIService {
  generateExplanation(job: AIWorkerJob): Promise<AIExplanation>;
  batchGenerateExplanations(jobs: AIWorkerJob[]): Promise<AIExplanation[]>;
}
```

**Prompt Template:**

```
You are a code quality expert analyzing a codebase issue.

Issue Type: {hauntingType}
Severity: {severity}
File: {filePath}
Lines: {startLine}-{endLine}

Code:
```
{codeSnippet}
```

Context:
{codeContext}

Repository Info:
- Language: {language}
- Framework: {framework}
- Dependencies: {dependencies}

Please provide:
1. A clear explanation of why this is a problem (2-3 sentences)
2. The potential impact on the codebase
3. A specific fix suggestion with code example
4. Any relevant best practices or references

Format your response as JSON:
{
  "explanation": "...",
  "impact": "...",
  "fixSuggestion": "...",
  "codeExample": "..."
}
```

### 5. Exorcism Service

**Responsibilities:**
- Generate code patches for auto-fixable issues
- Create GitHub branches
- Commit changes
- Create pull requests
- Update exorcism status

**Interface:**

```typescript
interface ExorcismService {
  canExorcise(issue: Issue): boolean;
  generatePatch(issue: Issue, fixSuggestion: string): Promise<Patch>;
  applyExorcism(issueId: string): Promise<ExorcismResult>;
}

interface Patch {
  filePath: string;
  originalContent: string;
  patchedContent: string;
  diff: string;
}

interface ExorcismResult {
  success: boolean;
  branchName: string;
  prUrl?: string;
  prNumber?: number;
  error?: string;
}
```

## Data Models

### TypeScript Type Definitions

```typescript
// Core domain types
type HauntingType = 'ghost' | 'zombie' | 'vampire' | 'skeleton' | 'monster';
type Severity = 'low' | 'medium' | 'high' | 'critical';
type ScanStatus = 'pending' | 'scanning' | 'analyzing' | 'completed' | 'failed';
type ExorcismStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface User {
  id: string;
  githubId: string;
  githubUsername: string;
  accessToken: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Repository {
  id: string;
  userId: string;
  githubRepoId: string;
  name: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch: string;
  lastScanAt?: Date;
  createdAt: Date;
}

interface Scan {
  id: string;
  repositoryId: string;
  status: ScanStatus;
  commitSha?: string;
  totalFiles?: number;
  totalIssues?: number;
  hauntingLevel?: string;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

interface Issue {
  id: string;
  scanId: string;
  hauntingType: HauntingType;
  severity: Severity;
  filePath: string;
  startLine: number;
  endLine: number;
  codeSnippet: string;
  ruleId: string;
  message: string;
  createdAt: Date;
}

interface AIExplanation {
  id: string;
  issueId: string;
  explanation: string;
  fixSuggestion?: string;
  codeExample?: string;
  generatedAt: Date;
}

interface Exorcism {
  id: string;
  issueId: string;
  status: ExorcismStatus;
  branchName?: string;
  prUrl?: string;
  prNumber?: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: OAuth redirect URL generation
*For any* user initiating GitHub authentication, the generated OAuth redirect URL should contain valid client_id, redirect_uri, and scope parameters
**Validates: Requirements 1.1**

### Property 2: Token storage and repository retrieval
*For any* successful OAuth callback with valid authorization code, the system should store the access token and successfully retrieve at least the user's accessible repositories
**Validates: Requirements 1.2**

### Property 3: Repository permission validation
*For any* repository selection, the system should validate access permissions before initiating a scan
**Validates: Requirements 1.3**

### Property 4: Connected repositories display completeness
*For any* user with connected repositories, the displayed list should include all connected repositories with their last scan timestamps
**Validates: Requirements 1.5**

### Property 5: Scan initiation triggers repository fetch
*For any* initiated scan, the scanner should fetch repository contents and parse all JavaScript and TypeScript files
**Validates: Requirements 2.1**

### Property 6: AST generation for valid source files
*For any* valid JavaScript or TypeScript source file, the scanner should successfully generate an Abstract Syntax Tree
**Validates: Requirements 2.2**

### Property 7: Issue categorization completeness
*For any* detected issue, the scanner should assign exactly one valid haunting type (ghost, zombie, vampire, skeleton, or monster)
**Validates: Requirements 2.3**

### Property 8: Unused code classification
*For any* detected unused code pattern (unused variable, function, or import), the scanner should classify it as a ghost haunting with file path and line numbers
**Validates: Requirements 2.4**

### Property 9: Deprecated dependency classification
*For any* detected deprecated dependency, the scanner should classify it as a zombie haunting with package name and version information
**Validates: Requirements 2.5**

### Property 10: Performance issue classification
*For any* detected performance issue (memory leak, inefficient algorithm, or high complexity loop), the scanner should classify it as a vampire haunting with performance metrics
**Validates: Requirements 2.6**

### Property 11: Missing coverage classification
*For any* detected missing test or documentation, the scanner should classify it as a skeleton haunting with coverage percentage
**Validates: Requirements 2.7**

### Property 12: High complexity classification
*For any* function with cyclomatic complexity greater than 10, the scanner should classify it as a monster haunting with the complexity score
**Validates: Requirements 2.8**

### Property 13: Scan output JSON validity
*For any* completed scan, the output should be valid JSON containing all detected issues with required metadata (haunting type, severity, file path, line numbers, code snippet)
**Validates: Requirements 2.9**

### Property 14: Scan result persistence completeness
*For any* generated scan result, all required fields (repository ID, timestamp, issues, and metadata) should be persisted to the database
**Validates: Requirements 3.1**

### Property 15: Most recent scan retrieval
*For any* repository with multiple scans, requesting scan results should return the scan with the most recent timestamp
**Validates: Requirements 3.2**

### Property 16: Scan history preservation
*For any* repository, all historical scans should be retrievable and ordered by timestamp
**Validates: Requirements 3.3**

### Property 17: Aggregate metrics calculation
*For any* stored scan result, the total issue count should equal the sum of issues across all haunting types, and haunting level should be calculated based on severity distribution
**Validates: Requirements 3.4**

### Property 18: AI service receives all issues
*For any* completed scan with detected issues, each issue should be sent to the AI Explanation Service with code context
**Validates: Requirements 4.1**

### Property 19: AI explanation generation completeness
*For any* issue sent to the AI service, the generated explanation should contain a problem description, impact statement, and fix suggestion
**Validates: Requirements 4.2, 4.3**

### Property 20: Explanation-issue linkage
*For any* generated AI explanation, it should be stored in the database with a valid reference to its corresponding issue
**Validates: Requirements 4.4**

### Property 21: Visualization icon completeness
*For any* scan result with issues, the visualization should display icons for each haunting type that has at least one issue
**Validates: Requirements 5.1**

### Property 22: Haunting count accuracy
*For any* displayed visualization, the count shown for each haunting type should match the actual number of issues of that type in the scan results
**Validates: Requirements 5.2**

### Property 23: Haunting level calculation correctness
*For any* set of issues, the calculated haunting level should increase monotonically with total issue count and severity
**Validates: Requirements 5.3**

### Property 24: Detail panel content completeness
*For any* clicked haunting icon, the detail panel should display file path, line numbers, code snippet, AI explanation, and fix suggestions
**Validates: Requirements 5.4**

### Property 25: Visualization reactivity
*For any* scan result update, the visualization should reflect the new state within the next render cycle
**Validates: Requirements 5.5**

### Property 26: Auto-fixability determination
*For any* issue, the system should correctly determine whether it is auto-fixable based on its haunting type and complexity
**Validates: Requirements 6.1**

### Property 27: Patch generation validity
*For any* auto-fixable issue, the generated patch should produce syntactically valid code that addresses the issue
**Validates: Requirements 6.2**

### Property 28: Branch naming convention
*For any* generated patch, the created branch name should follow the pattern "codecrypt/fix-{hauntingType}-{issueId}" and be unique
**Validates: Requirements 6.3**

### Property 29: Commit message completeness
*For any* exorcism commit, the commit message should reference the issue ID and describe the fix applied
**Validates: Requirements 6.4**

### Property 30: Pull request creation completeness
*For any* successful exorcism, the created pull request should have a title, description, and link back to the CodeCrypt issue
**Validates: Requirements 6.5**

### Property 31: Exorcism status update
*For any* created pull request, the corresponding issue status should be updated to "exorcism pending" and include the PR URL
**Validates: Requirements 6.7**

### Property 32: WebSocket connection establishment
*For any* user enabling live monitoring, a WebSocket connection should be established and remain active
**Validates: Requirements 7.1**

### Property 33: File save triggers quick scan
*For any* file save event in a monitored repository, a quick scan should be triggered for the modified files
**Validates: Requirements 7.2**

### Property 34: Quick scan broadcasts updates
*For any* completed quick scan, updated issue counts should be sent to all connected WebSocket clients
**Validates: Requirements 7.3**

### Property 35: Commit triggers full scan
*For any* git commit in a monitored repository, a full repository scan should be triggered
**Validates: Requirements 7.4**

### Property 36: Broadcast to all connected clients
*For any* scan result change, updates should be broadcast to all WebSocket clients viewing that repository
**Validates: Requirements 7.5**

### Property 37: CLI output format
*For any* CLI scan execution, the output should be a formatted table containing issue types, counts, and file locations
**Validates: Requirements 8.2**

### Property 38: API error response format
*For any* failed API request, the response should have an appropriate HTTP status code (4xx or 5xx) and a JSON body with an error message
**Validates: Requirements 9.1**

### Property 39: AI request batching
*For any* set of issues requiring AI explanations, requests should be batched in groups to optimize API usage
**Validates: Requirements 10.2**

### Property 40: Incremental results for large repositories
*For any* repository exceeding size thresholds, the system should provide incremental scan results and progress indicators
**Validates: Requirements 10.5**

## Error Handling

### Error Categories and Strategies

**1. GitHub API Errors:**
- **Rate Limiting**: Implement exponential backoff with jitter, queue requests, display wait time to users
- **Authentication Failures**: Clear stored tokens, redirect to re-authentication flow
- **Repository Access Denied**: Display clear error message with permission requirements
- **Network Errors**: Retry with exponential backoff (max 3 attempts), fallback to cached data if available

**2. Scanner Engine Errors:**
- **Parse Errors**: Log file path and error, continue scanning other files, report parse failures in results
- **Unsupported File Types**: Skip silently, log for debugging
- **Memory Exhaustion**: Implement file size limits, process large files in chunks
- **Timeout**: Set per-file timeout (30s), skip files that exceed timeout

**3. AI Service Errors:**
- **API Failures**: Retry with exponential backoff (max 3 attempts)
- **Rate Limiting**: Queue requests, implement token bucket algorithm
- **Timeout**: Set request timeout (10s), fallback to generic explanations
- **Invalid Responses**: Validate JSON schema, use fallback explanation if invalid

**4. Database Errors:**
- **Connection Failures**: Implement connection pooling with retry logic
- **Query Timeouts**: Set query timeout (5s), log slow queries
- **Constraint Violations**: Return 409 Conflict with descriptive message
- **Transaction Failures**: Rollback and retry (max 3 attempts)

**5. Exorcism Errors:**
- **Patch Application Failures**: Rollback branch creation, notify user with error details
- **PR Creation Failures**: Preserve branch, allow manual PR creation, log error
- **Merge Conflicts**: Detect conflicts, notify user, provide manual resolution instructions

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message
    details?: any; // Additional context
    timestamp: string;
    requestId: string; // For debugging
  };
}
```

### Logging Strategy

- **Structured Logging**: Use JSON format with consistent fields (timestamp, level, service, message, context)
- **Log Levels**: ERROR (system failures), WARN (recoverable issues), INFO (important events), DEBUG (detailed traces)
- **Sensitive Data**: Never log tokens, passwords, or PII
- **Correlation IDs**: Track requests across services using unique IDs

## Testing Strategy

### Unit Testing

**Framework**: Jest with TypeScript support

**Coverage Targets**:
- Core business logic: 90%+
- API endpoints: 85%+
- Scanner rules: 95%+
- Utility functions: 90%+

**Key Test Areas**:
1. **Scanner Engine**:
   - Test each haunting detection rule with positive and negative cases
   - Test AST parsing with various code patterns
   - Test issue categorization logic
   - Test JSON output format validation

2. **API Endpoints**:
   - Test request validation and error responses
   - Test authentication middleware
   - Test database operations with mocked DB
   - Test WebSocket connection handling

3. **AI Service**:
   - Test prompt generation with various issue types
   - Test response parsing and validation
   - Test fallback mechanisms
   - Test batching logic

4. **Exorcism Service**:
   - Test patch generation for different issue types
   - Test branch naming and commit message formatting
   - Test PR creation with mocked GitHub API
   - Test rollback on failures

### Property-Based Testing

**Framework**: fast-check for TypeScript

**Configuration**: Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test must include a comment explicitly referencing the correctness property from the design document using this format: `// Feature: codecrypt, Property {number}: {property_text}`

**Key Properties to Test**:

1. **Scanner Output Validity** (Property 13):
   - Generate random code samples
   - Verify output is always valid JSON
   - Verify all required fields are present

2. **Issue Categorization** (Property 7):
   - Generate random AST nodes
   - Verify each detected issue has exactly one haunting type

3. **Aggregate Metrics** (Property 17):
   - Generate random issue sets
   - Verify total count equals sum of individual counts
   - Verify haunting level increases with severity

4. **Haunting Count Accuracy** (Property 22):
   - Generate random scan results
   - Verify displayed counts match actual counts

5. **Branch Naming** (Property 28):
   - Generate random issue IDs and types
   - Verify branch names follow convention
   - Verify uniqueness

6. **Error Response Format** (Property 38):
   - Generate random error conditions
   - Verify all error responses have proper status codes and JSON format

7. **WebSocket Broadcast** (Property 36):
   - Generate random client connections
   - Verify all clients receive updates

### Integration Testing

**Framework**: Supertest for API testing, Playwright for E2E

**Test Scenarios**:
1. **Full Scan Flow**:
   - Connect repository → Trigger scan → Receive results → View visualization
   - Verify database state at each step
   - Verify WebSocket updates

2. **Exorcism Flow**:
   - Detect issue → Generate explanation → Apply fix → Create PR
   - Verify GitHub API calls
   - Verify status updates

3. **Real-time Updates**:
   - Connect WebSocket → Trigger scan → Receive updates
   - Verify message format and timing

4. **Error Recovery**:
   - Simulate GitHub API failures
   - Simulate AI service failures
   - Verify fallback mechanisms

### End-to-End Testing

**Test Cases**:
1. New user connects GitHub account and scans first repository
2. Existing user views scan history and compares results
3. User exorcises multiple issues and tracks PR status
4. User enables live monitoring and sees real-time updates
5. User uses CLI to scan local repository

### Performance Testing

**Tools**: Artillery for load testing, Lighthouse for frontend performance

**Benchmarks**:
- API response time: p95 < 500ms
- Scan completion: < 60s for repos under 1000 files
- WebSocket message latency: < 100ms
- Frontend initial load: < 2s

**Load Tests**:
- 50 concurrent users scanning repositories
- 100 concurrent WebSocket connections
- 1000 issues processed by AI service per minute

## Security Considerations

### Authentication & Authorization

- **OAuth Tokens**: Store encrypted in database, never log or expose in responses
- **Session Management**: Use HTTP-only cookies with secure flag, implement CSRF protection
- **API Authentication**: Require valid JWT for all protected endpoints
- **Repository Access**: Verify user has GitHub access before allowing operations

### Input Validation

- **Repository URLs**: Validate format, prevent SSRF attacks
- **File Paths**: Sanitize to prevent directory traversal
- **Code Snippets**: Limit size to prevent DoS, escape for display
- **User Input**: Validate and sanitize all user-provided data

### Rate Limiting

- **API Endpoints**: 100 requests per minute per user
- **Scan Triggers**: 10 scans per hour per repository
- **Exorcism Actions**: 20 per hour per user
- **WebSocket Connections**: 5 per user

### Data Privacy

- **Code Storage**: Store only necessary snippets, not full repository contents
- **Retention**: Delete scan results after 90 days
- **User Data**: Allow users to delete all their data
- **Third-party APIs**: Minimize data sent to AI services

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - VITE_API_URL=http://localhost:4000
  
  backend:
    build: ./backend
    ports: ["4000:4000"]
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/codecrypt
      - REDIS_URL=redis://redis:6379
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on: [db, redis]
  
  scanner:
    build: ./scanner
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on: [redis]
  
  ai-worker:
    build: ./workers/ai
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/codecrypt
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on: [db, redis]
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=codecrypt
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Production Considerations

- **Container Orchestration**: Kubernetes or Docker Swarm
- **Load Balancing**: Nginx or cloud load balancer
- **Database**: Managed PostgreSQL (AWS RDS, Google Cloud SQL)
- **Caching**: Managed Redis (AWS ElastiCache, Redis Cloud)
- **File Storage**: S3 or equivalent for temporary repository storage
- **Monitoring**: Prometheus + Grafana for metrics, Sentry for error tracking
- **Logging**: ELK stack or cloud logging service

## Future Enhancements

### Phase 2 Features

1. **Multi-language Support**: Add Python, Java, Go, Rust scanners
2. **Custom Rules**: Allow users to define custom haunting detection rules
3. **Team Features**: Shared repositories, team dashboards, collaboration
4. **Integrations**: Slack notifications, Jira ticket creation, GitHub Actions
5. **Analytics**: Trend analysis, technical debt tracking over time
6. **Gamification**: Achievements, leaderboards, exorcism streaks

### Phase 3 Features

1. **AI-Powered Refactoring**: Suggest architectural improvements
2. **Code Review Assistant**: Integrate into PR review process
3. **Learning Mode**: Explain why code patterns are problematic
4. **Mobile App**: View scan results on mobile devices
5. **Enterprise Features**: SSO, audit logs, compliance reports
