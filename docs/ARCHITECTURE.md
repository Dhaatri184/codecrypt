# CodeCrypt Architecture

## System Overview

CodeCrypt is a distributed system built with a microservices architecture, consisting of five main components:

1. **Frontend Application** - React-based user interface
2. **Backend API** - Node.js/Express REST API
3. **Scanner Engine** - Static code analysis service
4. **AI Worker** - Background service for generating explanations
5. **Database Layer** - PostgreSQL for persistent storage

## Architecture Diagram

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

## Component Details

### Frontend Application

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Framer Motion for animations
- React Query for data fetching
- Socket.io client for WebSocket

**Key Features:**
- GitHub OAuth flow
- Repository selection and management
- Haunted visualization interface
- Real-time scan updates
- Issue detail panels with AI explanations
- Exorcism (auto-fix) UI

**File Structure:**
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages
│   ├── contexts/       # React contexts (auth, etc.)
│   ├── hooks/          # Custom hooks (WebSocket, etc.)
│   ├── api/            # API client
│   └── App.tsx         # Main app component
```

### Backend API

**Technology Stack:**
- Node.js 20+ with Express
- TypeScript for type safety
- PostgreSQL with pg driver
- Redis for job queues and caching
- Bull for job queue management
- Socket.io for WebSocket
- JWT for authentication

**Key Responsibilities:**
- Handle HTTP requests and responses
- Orchestrate scanner and AI worker jobs
- Manage GitHub OAuth flow
- Serve scan results from database
- Broadcast real-time updates via WebSocket
- Rate limiting and error handling

**API Endpoints:**
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
GET    /api/exorcisms/:id
GET    /api/issues/:id/exorcism

GET    /api/health
```

### Scanner Engine

**Technology Stack:**
- TypeScript
- @typescript-eslint/parser for AST
- simple-git for repository operations
- Custom rule engine

**Detection Rules:**

1. **Ghost Detection (Dead Code)**
   - Unused variables, functions, imports
   - Unreachable code after return
   - Commented-out code blocks

2. **Zombie Detection (Deprecated)**
   - Outdated npm packages
   - Deprecated API usage
   - Legacy patterns

3. **Vampire Detection (Performance)**
   - Nested loops with high complexity
   - Memory leaks (uncleaned listeners)
   - Inefficient algorithms (O(n²) or worse)

4. **Skeleton Detection (Missing Coverage)**
   - Functions without JSDoc
   - Files without test files
   - Low test coverage areas

5. **Monster Detection (High Complexity)**
   - Functions with cyclomatic complexity > 10
   - Files with > 500 lines
   - Deeply nested conditionals (> 4 levels)

### AI Worker Service

**Technology Stack:**
- Node.js with TypeScript
- OpenAI GPT-4 API
- Bull for job processing
- PostgreSQL for storing explanations

**Responsibilities:**
- Consume issues from job queue
- Generate human-readable explanations
- Provide fix suggestions with code examples
- Store results in database
- Handle rate limiting and retries

**Prompt Template:**
```
You are a code quality expert analyzing a codebase issue.

Issue Type: {hauntingType}
Severity: {severity}
File: {filePath}
Lines: {startLine}-{endLine}

Code:
{codeSnippet}

Context:
{codeContext}

Please provide:
1. A clear explanation of why this is a problem
2. The potential impact on the codebase
3. A specific fix suggestion with code example
4. Any relevant best practices or references
```

### Database Schema

**Tables:**

1. **users** - GitHub user accounts
2. **repositories** - Connected repositories
3. **scans** - Scan executions and results
4. **issues** - Detected code quality issues
5. **ai_explanations** - AI-generated explanations
6. **exorcisms** - Auto-fix attempts and PRs

**Key Relationships:**
- User → Repositories (1:N)
- Repository → Scans (1:N)
- Scan → Issues (1:N)
- Issue → AI Explanation (1:1)
- Issue → Exorcism (1:1)

## Data Flow

### Scan Flow

1. User triggers scan via UI
2. Backend creates scan record in database
3. Backend queues scan job in Redis
4. Scanner worker picks up job
5. Scanner clones repository and analyzes code
6. Scanner detects issues and categorizes them
7. Scanner stores results in database
8. Backend queues AI explanation jobs
9. AI worker generates explanations
10. Backend broadcasts completion via WebSocket
11. Frontend updates visualization

### Exorcism Flow

1. User clicks "Exorcise" button
2. Backend validates issue is auto-fixable
3. Backend creates exorcism record
4. Backend generates code patch
5. Backend creates GitHub branch
6. Backend commits changes
7. Backend creates pull request
8. Backend updates exorcism status
9. Frontend displays PR link

## Security

### Authentication
- GitHub OAuth 2.0 for user authentication
- JWT tokens for API authentication
- HTTP-only cookies with secure flag
- CSRF protection

### Authorization
- User can only access their own repositories
- Repository access verified before operations
- GitHub permissions checked via API

### Data Protection
- Access tokens encrypted in database
- Sensitive data never logged
- Input validation and sanitization
- Rate limiting on all endpoints

## Performance Optimizations

### Caching
- Redis caching for GitHub API responses (5 min TTL)
- Scan results cached (1 hour TTL)
- Database query results cached

### Database
- Indexes on frequently queried columns
- Composite indexes for complex queries
- Connection pooling
- Query optimization

### Frontend
- Code splitting for lazy loading
- Image optimization
- Bundle size optimization
- React Query for data caching

### Scalability
- Horizontal scaling of worker services
- Load balancing for API servers
- Database read replicas
- CDN for static assets

## Monitoring & Logging

### Logging
- Structured JSON logging
- Log levels: ERROR, WARN, INFO, DEBUG
- Correlation IDs for request tracking
- No sensitive data in logs

### Metrics
- API response times
- Scan completion times
- Error rates
- WebSocket connection count
- Database query performance

### Error Tracking
- Sentry for error monitoring
- Slack notifications for critical errors
- Error aggregation and analysis

## Deployment

### Development
```bash
docker-compose up
```

### Production
- Kubernetes for orchestration
- Docker containers for all services
- Managed PostgreSQL (AWS RDS)
- Managed Redis (AWS ElastiCache)
- Load balancer (AWS ALB)
- CDN (CloudFront)

### CI/CD
- GitHub Actions for CI
- Automated testing on PR
- Docker image building
- Automated deployment to production

## Future Enhancements

### Phase 2
- Multi-language support (Python, Java, Go)
- Custom rule definitions
- Team collaboration features
- Slack/Jira integrations
- Trend analysis and metrics

### Phase 3
- AI-powered refactoring suggestions
- PR review integration
- Mobile app
- Enterprise features (SSO, audit logs)
- Learning mode with explanations
