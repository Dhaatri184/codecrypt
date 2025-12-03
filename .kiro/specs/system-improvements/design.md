# Design Document

## Overview

This design addresses critical improvements to the CodeCrypt system across five key areas:

1. **Property-Based Testing Infrastructure** - Comprehensive test coverage using fast-check library
2. **Complete Progress Tracking Implementation** - Finish incomplete scan progress features
3. **Enhanced Error Handling and Resilience** - Robust error recovery and monitoring
4. **Performance Monitoring and Optimization** - Metrics collection and bottleneck identification
5. **Security and Edge Case Handling** - Hardening against attacks and unusual inputs

The improvements build on the existing architecture without requiring major refactoring, focusing on filling gaps and enhancing reliability.

## Architecture

### Testing Architecture

```
tests/
├── unit/              # Unit tests for individual functions
├── integration/       # End-to-end workflow tests
└── property/          # Property-based tests
    ├── scanner/       # Scanner rule properties
    ├── progress/      # Progress tracking properties
    ├── api/           # API behavior properties
    └── security/      # Security properties
```

**Testing Library**: fast-check (JavaScript/TypeScript property-based testing)

### Progress Tracking Architecture

```
Scanner → Progress Callback → Worker → Database + WebSocket
                                      ↓
                                   Redis (cancellation flags)
                                      ↓
                                   Frontend (real-time updates)
```

**Key Components**:
- Scanner: Reports progress every 1 second or 10 files
- Worker: Throttles DB writes, broadcasts WebSocket events
- Redis: Stores cancellation flags with 1-hour TTL
- Frontend: Displays animated progress bars, stop buttons

### Monitoring Architecture

```
Application Code → Metrics Collector → Prometheus/StatsD
                                     ↓
                                  Metrics Endpoint (/metrics)
```

**Metrics to Track**:
- API response times (p50, p95, p99)
- Scan phase durations (clone, parse, analyze)
- Database query times
- Memory usage
- Error rates by type

## Components and Interfaces

### Property-Based Test Generator Interface

```typescript
interface TestGenerator<T> {
  arbitrary: fc.Arbitrary<T>;
  property: (value: T) => boolean | Promise<boolean>;
  examples?: T[];  // Edge cases to always test
}
```

### Progress Tracking Interfaces

```typescript
interface ProgressUpdate {
  scanId: string;
  progressPercentage: number;  // 0-100
  filesProcessed: number;
  totalFilesDiscovered: number;
  currentStatusMessage: string;
  timestamp: Date;
}

interface ScannerCallbacks {
  onProgress: (update: ProgressUpdate) => Promise<void>;
  shouldCancel: () => Promise<boolean>;
}

interface CancellationFlag {
  scanId: string;
  requestedAt: Date;
  requestedBy: string;
}
```

### Metrics Interface

```typescript
interface MetricsCollector {
  recordTiming(metric: string, duration: number, tags?: Record<string, string>): void;
  incrementCounter(metric: string, tags?: Record<string, string>): void;
  recordGauge(metric: string, value: number, tags?: Record<string, string>): void;
}

interface PerformanceMetrics {
  apiResponseTime: Histogram;
  scanDuration: Histogram;
  dbQueryTime: Histogram;
  memoryUsage: Gauge;
  errorRate: Counter;
}
```

### Error Handling Interface

```typescript
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

interface CircuitBreaker {
  execute<T>(operation: () => Promise<T>): Promise<T>;
  getState(): 'closed' | 'open' | 'half-open';
  reset(): void;
}
```

## Data Models

### Enhanced Scan Model

```typescript
interface Scan {
  id: string;
  repositoryId: string;
  status: 'pending' | 'scanning' | 'analyzing' | 'completed' | 'failed' | 'cancelled';
  progressPercentage: number;
  filesProcessed: number;
  totalFilesDiscovered: number;
  currentStatusMessage: string;
  startedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  phaseTimings: {
    clone?: number;
    discover?: number;
    scan?: number;
    analyze?: number;
  };
}
```

### Metrics Model

```typescript
interface MetricEntry {
  timestamp: Date;
  metricName: string;
  value: number;
  tags: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all testable properties from the prework, I've identified the following consolidations:

- Properties 2.2 and 1.5 both test throttling behavior and can be combined into a single comprehensive throttling property
- Properties 3.2 and 5.2 both test exponential backoff and can be combined
- Properties 2.1 and 2.3 both test progress reporting and can be combined into a single property about progress updates

The following properties provide unique validation value and will be implemented:

### Progress Tracking Properties

**Property 1: Progress percentage bounds**
*For any* file count (processed and total), the calculated progress percentage should always be between 0 and 100 inclusive.
**Validates: Requirements 1.2**

**Property 2: Progress monotonicity**
*For any* sequence of progress updates during a scan, the progress percentage should never decrease.
**Validates: Requirements 1.3**

**Property 3: Progress update completeness**
*For any* progress update, it should contain all required fields: scanId, progressPercentage, filesProcessed, totalFilesDiscovered, currentStatusMessage, and timestamp.
**Validates: Requirements 2.1, 2.3**

**Property 4: Throttling prevents excessive updates**
*For any* rapid sequence of progress updates, the system should emit at most one database write per second and at most two WebSocket broadcasts per second.
**Validates: Requirements 1.5, 2.2**

**Property 5: Partial results persistence**
*For any* scan that is cancelled at any point, all issues detected before cancellation should be saved to the database.
**Validates: Requirements 1.4**

**Property 6: File count accuracy**
*For any* set of files processed, the reported filesProcessed count should exactly match the number of files actually analyzed.
**Validates: Requirements 2.1**

### Error Handling Properties

**Property 7: Structured error logging**
*For any* error that occurs, the logged error data should include errorType, message, stack trace, context, and timestamp.
**Validates: Requirements 3.1**

**Property 8: Exponential backoff timing**
*For any* sequence of retry attempts, the delay between attempts should follow exponential backoff: delay(n) = min(initialDelay * multiplier^n, maxDelay).
**Validates: Requirements 3.2, 5.2**

**Property 9: Circuit breaker state transitions**
*For any* sequence of operations, the circuit breaker should transition from closed → open after threshold failures, and from open → half-open after timeout.
**Validates: Requirements 3.4**

**Property 10: Error alerts for critical errors**
*For any* error classified as critical, an alert should be sent to the monitoring system.
**Validates: Requirements 3.5**

### Performance Properties

**Property 11: Metrics recording completeness**
*For any* API request, timing metrics should be recorded with endpoint, method, status code, and duration.
**Validates: Requirements 4.1**

**Property 12: Scan phase timing tracking**
*For any* completed scan, timing data should be recorded for all phases: clone, discover, scan, and analyze.
**Validates: Requirements 4.2**

**Property 13: Slow query logging**
*For any* database query, if execution time exceeds 100ms, it should be logged with query text and duration.
**Validates: Requirements 4.3**

**Property 14: Metrics endpoint accessibility**
*For any* collected metrics, they should be accessible via the /metrics endpoint in Prometheus format.
**Validates: Requirements 4.5**

### Concurrency Properties

**Property 15: Scan isolation**
*For any* two scans running concurrently, modifying state in one scan should not affect the state of the other scan.
**Validates: Requirements 5.1**

**Property 16: Rate limiting under load**
*For any* burst of requests exceeding the rate limit, the system should reject excess requests with 429 status code.
**Validates: Requirements 5.5**

### User Feedback Properties

**Property 17: Clone time estimation**
*For any* repository being cloned, an estimated time remaining should be calculated based on repository size.
**Validates: Requirements 7.1**

**Property 18: Batch progress reporting**
*For any* batch of AI explanations being generated, progress updates should be sent after each batch completes.
**Validates: Requirements 7.2**

**Property 19: Exorcism step reporting**
*For any* exorcism operation, status updates should be sent for each step: branch creation, commit, and PR creation.
**Validates: Requirements 7.3**

**Property 20: Error messages include suggestions**
*For any* error presented to users, the error message should include at least one actionable suggestion for resolution.
**Validates: Requirements 7.4**

**Property 21: Operation completion summaries**
*For any* completed operation, a summary should be provided with statistics and next steps.
**Validates: Requirements 7.5**

### Documentation Properties

**Property 22: JSDoc completeness**
*For any* exported function, it should have JSDoc comments with description, parameter types, and return type.
**Validates: Requirements 8.2**

**Property 23: Logging level appropriateness**
*For any* log entry, the log level (debug, info, warn, error) should match the severity of the event.
**Validates: Requirements 8.5**

### Security Properties

**Property 24: Sensitive data encryption**
*For any* sensitive data (tokens, credentials) stored in the database, it should be encrypted using AES-256.
**Validates: Requirements 9.1**

**Property 25: Input validation**
*For any* user input, it should be validated against a schema and sanitized before processing.
**Validates: Requirements 9.3**

### Edge Case Properties

**Property 26: Binary file handling**
*For any* repository containing binary files, the scanner should skip them without errors and only process text files.
**Validates: Requirements 10.2**

**Property 27: Syntax error resilience**
*For any* file with syntax errors, the parser should catch the error, log it, and continue processing other files.
**Validates: Requirements 10.3**

**Property 28: Network failure retry**
*For any* network operation that fails, the system should retry with exponential backoff up to the maximum attempts.
**Validates: Requirements 10.4**

## Error Handling

### Error Classification

```typescript
enum ErrorSeverity {
  DEBUG = 'debug',      // Expected errors, debugging info
  INFO = 'info',        // Informational, no action needed
  WARNING = 'warning',  // Potential issues, monitor
  ERROR = 'error',      // Errors that need attention
  CRITICAL = 'critical' // System-threatening errors, alert immediately
}

enum ErrorCategory {
  NETWORK = 'network',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  PARSING = 'parsing',
  RESOURCE = 'resource'
}
```

### Retry Strategy

- **Network errors**: Exponential backoff, max 5 attempts
- **Database errors**: Exponential backoff, max 3 attempts
- **GitHub API rate limits**: Wait until rate limit reset
- **AI service errors**: Exponential backoff, max 3 attempts, then fallback

### Circuit Breaker Configuration

```typescript
const circuitBreakerConfig = {
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,       // Close after 2 successes in half-open
  timeout: 60000,            // Try half-open after 60s
  monitoringPeriod: 10000    // Track failures over 10s window
};
```

### Fallback Strategies

- **AI service unavailable**: Use cached explanations or generic templates
- **Redis unavailable**: Fall back to database for coordination
- **GitHub API unavailable**: Queue operations for later retry
- **Database unavailable**: Return cached data if available, otherwise fail gracefully

## Testing Strategy

### Unit Testing

- Test individual functions with specific examples
- Test error conditions and edge cases
- Test boundary values (0, 1, max values)
- Mock external dependencies (GitHub API, OpenAI API)
- Target: 80% code coverage

### Property-Based Testing

**Library**: fast-check (minimum 100 iterations per property)

**Test Organization**:
- Each correctness property gets its own test file
- Tests tagged with property number: `// Property 1: Progress percentage bounds`
- Generators for domain objects (scans, files, errors, etc.)
- Shrinking enabled to find minimal failing cases

**Key Generators**:
```typescript
// Generate valid file counts
const fileCountArb = fc.record({
  processed: fc.nat(10000),
  total: fc.nat(10000)
}).filter(({ processed, total }) => processed <= total);

// Generate progress updates
const progressUpdateArb = fc.record({
  scanId: fc.uuid(),
  progressPercentage: fc.integer(0, 100),
  filesProcessed: fc.nat(10000),
  totalFilesDiscovered: fc.nat(10000),
  currentStatusMessage: fc.string(),
  timestamp: fc.date()
});

// Generate error scenarios
const errorArb = fc.oneof(
  fc.constant(new NetworkError()),
  fc.constant(new DatabaseError()),
  fc.constant(new ValidationError())
);
```

### Integration Testing

- Test complete workflows end-to-end
- Use test database and Redis instances
- Mock external APIs (GitHub, OpenAI)
- Test WebSocket connections
- Test concurrent operations
- Target: All critical user flows covered

### Performance Testing

- Load test with 50 concurrent scans
- Measure response times under load
- Test memory usage with large repositories
- Verify rate limiting works correctly
- Identify bottlenecks with profiling

## Implementation Phases

### Phase 1: Property-Based Testing Infrastructure (Week 1)
- Setup fast-check library
- Create test generators for domain objects
- Implement first 10 properties
- Establish testing patterns

### Phase 2: Complete Progress Tracking (Week 1-2)
- Implement missing progress tracking features
- Add WebSocket throttling
- Complete cancellation flow
- Add progress bar animations

### Phase 3: Error Handling and Resilience (Week 2)
- Implement circuit breaker pattern
- Add exponential backoff retry logic
- Enhance error logging
- Add monitoring alerts

### Phase 4: Performance Monitoring (Week 3)
- Implement metrics collection
- Add /metrics endpoint
- Setup performance profiling
- Optimize identified bottlenecks

### Phase 5: Security and Edge Cases (Week 3)
- Add input validation
- Implement data encryption
- Handle edge cases (empty repos, binary files, syntax errors)
- Security audit

### Phase 6: Documentation and Polish (Week 4)
- Add JSDoc comments
- Update architecture diagrams
- Write integration tests
- Final testing and bug fixes

## Performance Targets

- API response time: p95 < 200ms
- Scan completion: < 60s for repos under 1000 files
- Progress update latency: < 100ms
- WebSocket message delivery: < 50ms
- Database query time: p95 < 50ms
- Memory usage: < 512MB per worker process

## Security Considerations

- Encrypt GitHub tokens using AES-256-GCM
- Use HTTPS for all external communication
- Validate all user inputs against schemas
- Sanitize inputs to prevent injection attacks
- Run scanner in isolated Docker container
- Use minimal GitHub OAuth scopes (repo:read)
- Implement rate limiting to prevent abuse
- Log security events for audit trail

## Monitoring and Observability

### Metrics to Expose

- `api_request_duration_seconds` - API response times
- `scan_duration_seconds` - Scan completion times
- `scan_phase_duration_seconds` - Individual phase times
- `db_query_duration_seconds` - Database query times
- `error_count_total` - Error counts by type
- `active_scans_gauge` - Current number of active scans
- `websocket_connections_gauge` - Active WebSocket connections

### Logging Strategy

- Structured JSON logging
- Include correlation IDs for request tracing
- Log levels: DEBUG, INFO, WARN, ERROR, CRITICAL
- Sensitive data redaction
- Log aggregation to centralized system

### Alerting Rules

- Error rate > 5% for 5 minutes → Alert
- API p95 latency > 500ms for 5 minutes → Alert
- Database connection failures → Immediate alert
- Memory usage > 80% → Warning
- Disk space < 10% → Critical alert
