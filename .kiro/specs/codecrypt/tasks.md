# Implementation Plan

- [x] 1. Setup project structure and development environment


  - Create monorepo structure with frontend/, backend/, scanner/, workers/ directories
  - Initialize TypeScript configuration for each package
  - Setup Docker Compose with PostgreSQL, Redis, and service containers
  - Create shared types package for common interfaces
  - Setup ESLint and Prettier for code formatting
  - Initialize Git repository with .gitignore and README
  - _Requirements: All (foundational)_


- [x] 1.1 Write property test for project structure validation

  - **Feature: codecrypt, Property 13: Scan output JSON validity**
  - **Validates: Requirements 2.9**

- [x] 2. Implement database schema and migrations



  - Create PostgreSQL migration scripts for users, repositories, scans, issues, ai_explanations, and exorcisms tables
  - Setup database connection pooling with pg library
  - Create database seed scripts for development
  - Implement database utility functions for common queries
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2.1 Write unit tests for database operations


  - Test CRUD operations for each table
  - Test transaction rollback scenarios
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Build GitHub OAuth authentication flow


  - Implement OAuth initiation endpoint that generates GitHub authorization URL
  - Create OAuth callback handler to exchange code for access token
  - Store encrypted access tokens in database
  - Implement JWT-based session management
  - Create authentication middleware for protected routes
  - _Requirements: 1.1, 1.2_

- [x] 3.1 Write property test for OAuth URL generation


  - **Feature: codecrypt, Property 1: OAuth redirect URL generation**
  - **Validates: Requirements 1.1**

- [x] 3.2 Write property test for token storage


  - **Feature: codecrypt, Property 2: Token storage and repository retrieval**
  - **Validates: Requirements 1.2**

- [x] 4. Implement GitHub repository integration



  - Create service to fetch user's repositories from GitHub API
  - Implement repository connection endpoint with permission validation
  - Store connected repositories in database
  - Create endpoint to list connected repositories with last scan timestamps
  - Handle GitHub API rate limiting with exponential backoff
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 4.1 Write property test for repository permission validation


  - **Feature: codecrypt, Property 3: Repository permission validation**
  - **Validates: Requirements 1.3**

- [x] 4.2 Write property test for connected repositories display

  - **Feature: codecrypt, Property 4: Connected repositories display completeness**
  - **Validates: Requirements 1.5**

- [x] 5. Build Scanner Engine core functionality


  - Implement repository cloning/fetching logic using simple-git
  - Create file discovery system to find JavaScript and TypeScript files
  - Integrate @typescript-eslint/parser for AST generation
  - Build AST traversal framework for rule application
  - Implement JSON output formatter for scan results
  - _Requirements: 2.1, 2.2, 2.9_

- [x] 5.1 Write property test for scan initiation



  - **Feature: codecrypt, Property 5: Scan initiation triggers repository fetch**
  - **Validates: Requirements 2.1**

- [x] 5.2 Write property test for AST generation

  - **Feature: codecrypt, Property 6: AST generation for valid source files**
  - **Validates: Requirements 2.2**

- [x] 5.3 Write property test for scan output JSON validity

  - **Feature: codecrypt, Property 13: Scan output JSON validity**
  - **Validates: Requirements 2.9**

- [x] 6. Implement haunting detection rules



  - Create Ghost detection rule for unused variables, functions, and imports
  - Create Zombie detection rule for deprecated dependencies using npm outdated
  - Create Vampire detection rule for performance issues (nested loops, memory leaks)
  - Create Skeleton detection rule for missing tests and documentation
  - Create Monster detection rule for high cyclomatic complexity functions
  - Implement issue categorization system that assigns haunting types
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 6.1 Write property test for issue categorization

  - **Feature: codecrypt, Property 7: Issue categorization completeness**
  - **Validates: Requirements 2.3**

- [x] 6.2 Write property test for unused code classification

  - **Feature: codecrypt, Property 8: Unused code classification**
  - **Validates: Requirements 2.4**

- [x] 6.3 Write property test for deprecated dependency classification

  - **Feature: codecrypt, Property 9: Deprecated dependency classification**
  - **Validates: Requirements 2.5**

- [x] 6.4 Write property test for performance issue classification

  - **Feature: codecrypt, Property 10: Performance issue classification**
  - **Validates: Requirements 2.6**

- [x] 6.5 Write property test for missing coverage classification

  - **Feature: codecrypt, Property 11: Missing coverage classification**
  - **Validates: Requirements 2.7**

- [x] 6.6 Write property test for high complexity classification

  - **Feature: codecrypt, Property 12: High complexity classification**
  - **Validates: Requirements 2.8**

- [x] 7. Build Backend API scan orchestration





  - Create POST /api/scans endpoint to trigger scans
  - Implement scan job queue using Bull and Redis
  - Create scan worker that processes jobs and calls Scanner Engine
  - Implement scan result persistence to database
  - Create GET /api/scans/:id endpoint to retrieve scan results
  - Create GET /api/repositories/:id/scans endpoint for scan history
  - Calculate and store aggregate metrics (total issues, haunting level)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7.1 Write property test for scan result persistence


  - **Feature: codecrypt, Property 14: Scan result persistence completeness**
  - **Validates: Requirements 3.1**

- [x] 7.2 Write property test for most recent scan retrieval


  - **Feature: codecrypt, Property 15: Most recent scan retrieval**
  - **Validates: Requirements 3.2**

- [x] 7.3 Write property test for scan history preservation


  - **Feature: codecrypt, Property 16: Scan history preservation**
  - **Validates: Requirements 3.3**

- [x] 7.4 Write property test for aggregate metrics calculation


  - **Feature: codecrypt, Property 17: Aggregate metrics calculation**
  - **Validates: Requirements 3.4**

- [x] 8. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement AI Explanation Service


  - Create AI worker that consumes issues from job queue
  - Implement OpenAI GPT-4 API integration with prompt templates
  - Build explanation generation logic with code context
  - Implement fix suggestion generation with code examples
  - Store AI explanations in database linked to issues
  - Implement fallback mechanism for AI service failures
  - Add request batching to optimize API usage
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.2_

- [x] 9.1 Write property test for AI service receives all issues

  - **Feature: codecrypt, Property 18: AI service receives all issues**
  - **Validates: Requirements 4.1**

- [x] 9.2 Write property test for AI explanation generation

  - **Feature: codecrypt, Property 19: AI explanation generation completeness**
  - **Validates: Requirements 4.2, 4.3**

- [x] 9.3 Write property test for explanation-issue linkage

  - **Feature: codecrypt, Property 20: Explanation-issue linkage**
  - **Validates: Requirements 4.4**

- [x] 9.4 Write property test for AI request batching

  - **Feature: codecrypt, Property 39: AI request batching**
  - **Validates: Requirements 10.2**

- [x] 10. Build Frontend React application structure



  - Initialize Vite + React + TypeScript project
  - Setup TailwindCSS and configure theme with spooky colors
  - Create routing structure with React Router
  - Implement API client with React Query for data fetching
  - Create authentication context and protected route wrapper
  - Build layout components (header, sidebar, main content area)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 11. Implement GitHub OAuth flow in frontend

  - Create login page with "Connect GitHub" button
  - Implement OAuth callback handler page
  - Store JWT token in localStorage
  - Create authentication state management
  - Build repository selection page
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 12. Build haunted visualization UI

  - Create main visualization component with haunted mansion/graveyard theme
  - Implement haunting icons for each type (ghost, zombie, vampire, skeleton, monster)
  - Display issue counts for each haunting type
  - Calculate and display overall haunting level with visual indicator
  - Add animations using Framer Motion for spooky effects
  - Implement responsive design for mobile and desktop
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 12.1 Write property test for visualization icon completeness

  - **Feature: codecrypt, Property 21: Visualization icon completeness**
  - **Validates: Requirements 5.1**

- [x] 12.2 Write property test for haunting count accuracy

  - **Feature: codecrypt, Property 22: Haunting count accuracy**
  - **Validates: Requirements 5.2**

- [x] 12.3 Write property test for haunting level calculation

  - **Feature: codecrypt, Property 23: Haunting level calculation correctness**
  - **Validates: Requirements 5.3**

- [x] 13. Implement issue detail panel

  - Create modal or side panel component for issue details
  - Display file path, line numbers, and code snippet with syntax highlighting
  - Show AI-generated explanation and fix suggestions
  - Add "Exorcise" button for auto-fixable issues
  - Implement copy-to-clipboard functionality for code snippets
  - _Requirements: 5.4_

- [x] 13.1 Write property test for detail panel content completeness

  - **Feature: codecrypt, Property 24: Detail panel content completeness**
  - **Validates: Requirements 5.4**

- [x] 14. Implement scan triggering and result display

  - Create "Scan Repository" button that triggers API call
  - Show loading state with progress indicator during scan
  - Implement automatic result refresh when scan completes
  - Display scan history with timestamps
  - Add ability to compare scans side-by-side
  - _Requirements: 3.2, 3.3, 5.5_

- [x] 14.1 Write property test for visualization reactivity

  - **Feature: codecrypt, Property 25: Visualization reactivity**
  - **Validates: Requirements 5.5**

- [x] 15. Build Exorcism Service for auto-fixing issues



  - Implement auto-fixability determination logic based on issue type
  - Create patch generation system for simple fixes (unused imports, formatting)
  - Integrate GitHub API for branch creation
  - Implement commit creation with descriptive messages
  - Create pull request generation with title, description, and links
  - Add rollback mechanism for failed exorcisms
  - Update issue status to "exorcism pending" after PR creation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 15.1 Write property test for auto-fixability determination




  - **Feature: codecrypt, Property 26: Auto-fixability determination**
  - **Validates: Requirements 6.1**

- [x] 15.2 Write property test for patch generation validity


  - **Feature: codecrypt, Property 27: Patch generation validity**
  - **Validates: Requirements 6.2**

- [x] 15.3 Write property test for branch naming convention


  - **Feature: codecrypt, Property 28: Branch naming convention**
  - **Validates: Requirements 6.3**

- [x] 15.4 Write property test for commit message completeness


  - **Feature: codecrypt, Property 29: Commit message completeness**
  - **Validates: Requirements 6.4**


- [x] 15.5 Write property test for pull request creation

  - **Feature: codecrypt, Property 30: Pull request creation completeness**
  - **Validates: Requirements 6.5**


- [x] 15.6 Write property test for exorcism status update

  - **Feature: codecrypt, Property 31: Exorcism status update**
  - **Validates: Requirements 6.7**

- [x] 16. Implement exorcism UI flow




  - Add "Exorcise" button to issue detail panel
  - Show loading state during exorcism process
  - Display success message with PR link after completion
  - Handle and display error messages for failed exorcisms
  - Update issue status badge in visualization
  - _Requirements: 6.1, 6.7_

- [x] 17. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.


- [x] 18. Implement WebSocket real-time updates



  - Setup Socket.io server in backend
  - Create WebSocket connection management with room-based subscriptions
  - Implement scan result change detection and broadcasting
  - Add WebSocket client in frontend with auto-reconnection
  - Update visualization in real-time when receiving WebSocket messages
  - Implement file watch system for live monitoring
  - Trigger quick scans on file save events
  - Trigger full scans on git commit events
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 18.1 Write property test for WebSocket connection establishment


  - **Feature: codecrypt, Property 32: WebSocket connection establishment**
  - **Validates: Requirements 7.1**

- [x] 18.2 Write property test for file save triggers quick scan


  - **Feature: codecrypt, Property 33: File save triggers quick scan**
  - **Validates: Requirements 7.2**

- [x] 18.3 Write property test for quick scan broadcasts updates


  - **Feature: codecrypt, Property 34: Quick scan broadcasts updates**
  - **Validates: Requirements 7.3**

- [x] 18.4 Write property test for commit triggers full scan


  - **Feature: codecrypt, Property 35: Commit triggers full scan**
  - **Validates: Requirements 7.4**

- [x] 18.5 Write property test for broadcast to all connected clients


  - **Feature: codecrypt, Property 36: Broadcast to all connected clients**
  - **Validates: Requirements 7.5**

- [x] 19. Build CLI tool for local scanning



  - Create Node.js CLI application with commander.js
  - Implement "codecrypt scan" command for local repositories
  - Add authentication command to store API token
  - Format scan results as terminal table using cli-table3
  - Add color coding for severity levels using chalk
  - Implement progress indicators for scan status
  - _Requirements: 8.1, 8.2_

- [x] 19.1 Write property test for CLI output format


  - **Feature: codecrypt, Property 37: CLI output format**
  - **Validates: Requirements 8.2**

- [x] 20. Implement comprehensive error handling



  - Add error handling middleware to Express app
  - Implement standardized error response format with codes and messages
  - Add GitHub API rate limit handling with retry logic
  - Implement AI service fallback for failures and timeouts
  - Add database error handling with transaction rollbacks
  - Create user-friendly error messages for all error types
  - Setup error logging with structured format
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
x

- [x] 20.1 Write property test for API error response format


  - **Feature: codecrypt, Property 38: API error response format**
  - **Validates: Requirements 9.1**

- [x] 21. Implement performance optimizations



  - Add Redis caching for GitHub API responses
  - Implement database query optimization with indexes
  - Add pagination for scan history and issue lists
  - Implement lazy loading for large code snippets
  - Add request debouncing for real-time updates
  - Optimize frontend bundle size with code splitting
  - Implement incremental scan results for large repositories
  - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [x] 21.1 Write property test for incremental results


  - **Feature: codecrypt, Property 40: Incremental results for large repositories**
  - **Validates: Requirements 10.5**

- [x] 22. Create demo repository with intentional issues


  - Create sample JavaScript/TypeScript project with various code smells
  - Add unused variables, functions, and imports (ghosts)
  - Include deprecated dependencies (zombies)
  - Add performance issues like nested loops (vampires)
  - Create files without tests or documentation (skeletons)
  - Write high complexity functions (monsters)
  - Document each intentional issue for demo purposes
  - _Requirements: All (for demonstration)_

- [x] 23. Setup CI/CD pipeline



  - Create GitHub Actions workflow for automated testing
  - Add linting and type checking steps
  - Implement automated database migrations
  - Setup Docker image building and pushing
  - Add deployment scripts for production environment
  - _Requirements: All (infrastructure)_

- [x] 24. Write project documentation






  - Create comprehensive README with setup instructions
  - Document API endpoints with request/response examples
  - Write architecture documentation with diagrams
  - Create user guide for connecting repositories and using features
  - Document haunting detection rules and severity levels
  - Add contributing guidelines for open source
  - Create demo video script and record 3-minute demonstration
  - _Requirements: All (documentation)_


- [x] 25. Final Checkpoint - Ensure all tests pass and system works end-to-end



  - Ensure all tests pass, ask the user if questions arise.
  - Test complete flow: GitHub auth → Connect repo → Scan → View results → Exorcise issue → Create PR
  - Verify WebSocket real-time updates work correctly
  - Test CLI tool with local repository
  - Verify error handling for all failure scenarios
  - Check performance with large repositories
  - Validate security measures (token encryption, input sanitization)
