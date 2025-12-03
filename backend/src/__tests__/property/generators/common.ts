/**
 * Common test data generators for property-based testing
 * Uses fast-check library to generate random test data
 */

import * as fc from 'fast-check';

/**
 * Generate valid file counts for progress tracking
 * Ensures processed <= total
 */
export const fileCountArb = fc
  .record({
    processed: fc.nat(10000),
    total: fc.nat(10000),
  })
  .filter(({ processed, total }) => processed <= total);

/**
 * Generate progress update objects
 */
export const progressUpdateArb = fc.record({
  scanId: fc.uuid(),
  progressPercentage: fc.integer({ min: 0, max: 100 }),
  filesProcessed: fc.nat(10000),
  totalFilesDiscovered: fc.nat(10000),
  currentStatusMessage: fc.string({ minLength: 1, maxLength: 200 }),
  timestamp: fc.date(),
});

/**
 * Generate scan IDs (UUIDs)
 */
export const scanIdArb = fc.uuid();

/**
 * Generate timestamps
 */
export const timestampArb = fc.date();

/**
 * Generate error scenarios
 */
export const errorTypeArb = fc.oneof(
  fc.constant('network'),
  fc.constant('database'),
  fc.constant('validation'),
  fc.constant('authentication'),
  fc.constant('external_api'),
  fc.constant('parsing'),
  fc.constant('resource')
);

/**
 * Generate error severity levels
 */
export const errorSeverityArb = fc.oneof(
  fc.constant('debug'),
  fc.constant('info'),
  fc.constant('warning'),
  fc.constant('error'),
  fc.constant('critical')
);

/**
 * Generate structured error objects
 */
export const structuredErrorArb = fc.record({
  errorType: errorTypeArb,
  message: fc.string({ minLength: 1, maxLength: 500 }),
  stack: fc.string({ minLength: 10, maxLength: 1000 }),
  context: fc.dictionary(fc.string(), fc.anything()),
  timestamp: fc.date(),
  severity: errorSeverityArb,
});

/**
 * Generate retry configuration
 */
export const retryConfigArb = fc.record({
  maxAttempts: fc.integer({ min: 1, max: 10 }),
  initialDelayMs: fc.integer({ min: 100, max: 5000 }),
  maxDelayMs: fc.integer({ min: 5000, max: 60000 }),
  backoffMultiplier: fc.double({ min: 1.5, max: 3.0 }),
});

/**
 * Generate scan objects
 */
export const scanArb = fc.record({
  id: fc.uuid(),
  repositoryId: fc.uuid(),
  status: fc.oneof(
    fc.constant('pending'),
    fc.constant('scanning'),
    fc.constant('analyzing'),
    fc.constant('completed'),
    fc.constant('failed'),
    fc.constant('cancelled')
  ),
  progressPercentage: fc.integer({ min: 0, max: 100 }),
  filesProcessed: fc.nat(10000),
  totalFilesDiscovered: fc.nat(10000),
  currentStatusMessage: fc.string({ minLength: 1, maxLength: 200 }),
  startedAt: fc.date(),
});

/**
 * Generate metric entries
 */
export const metricEntryArb = fc.record({
  timestamp: fc.date(),
  metricName: fc.string({ minLength: 1, maxLength: 100 }),
  value: fc.double({ min: 0, max: 1000000 }),
  tags: fc.dictionary(fc.string(), fc.string()),
  type: fc.oneof(
    fc.constant('counter'),
    fc.constant('gauge'),
    fc.constant('histogram')
  ),
});

/**
 * Generate API endpoint paths
 */
export const apiEndpointArb = fc.oneof(
  fc.constant('/api/scans'),
  fc.constant('/api/scans/:id'),
  fc.constant('/api/repositories'),
  fc.constant('/api/auth/callback'),
  fc.constant('/api/exorcisms')
);

/**
 * Generate HTTP methods
 */
export const httpMethodArb = fc.oneof(
  fc.constant('GET'),
  fc.constant('POST'),
  fc.constant('PUT'),
  fc.constant('DELETE'),
  fc.constant('PATCH')
);

/**
 * Generate HTTP status codes
 */
export const httpStatusArb = fc.oneof(
  fc.constant(200),
  fc.constant(201),
  fc.constant(400),
  fc.constant(401),
  fc.constant(403),
  fc.constant(404),
  fc.constant(429),
  fc.constant(500),
  fc.constant(503)
);
