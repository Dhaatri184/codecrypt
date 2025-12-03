/**
 * Feature enhancements test data generators for backend property-based testing
 * Uses fast-check library to generate random test data
 */

import * as fc from 'fast-check';

/**
 * Generate haunting types
 */
export const hauntingTypeArb = fc.oneof(
  fc.constant('ghost'),
  fc.constant('zombie'),
  fc.constant('vampire'),
  fc.constant('skeleton'),
  fc.constant('monster')
);

/**
 * Generate severity levels
 */
export const severityArb = fc.oneof(
  fc.constant('low'),
  fc.constant('medium'),
  fc.constant('high'),
  fc.constant('critical')
);

/**
 * Generate dismissal reasons
 */
export const dismissalReasonArb = fc.oneof(
  fc.constant('false_positive'),
  fc.constant('wont_fix'),
  fc.constant('accepted_risk'),
  fc.constant('planned'),
  fc.constant('other')
);

/**
 * Generate issue hash (SHA-256)
 */
export const issueHashArb = fc.hexaString({ minLength: 64, maxLength: 64 });

/**
 * Generate dismissal records
 */
export const dismissalRecordArb = fc.record({
  id: fc.uuid(),
  issue_id: fc.uuid(),
  dismissed_by: fc.string({ minLength: 3, maxLength: 255 }),
  dismissed_at: fc.date(),
  reason: dismissalReasonArb,
  notes: fc.option(fc.string({ maxLength: 1000 })),
  issue_hash: issueHashArb,
  created_at: fc.date(),
});

/**
 * Generate note records
 */
export const noteRecordArb = fc.record({
  id: fc.uuid(),
  issue_id: fc.uuid(),
  author: fc.string({ minLength: 3, maxLength: 255 }),
  content: fc.string({ minLength: 1, maxLength: 5000 }),
  created_at: fc.date(),
  updated_at: fc.date(),
});

/**
 * Generate schedule type
 */
export const scheduleTypeArb = fc.oneof(
  fc.constant('daily'),
  fc.constant('weekly'),
  fc.constant('on_push')
);

/**
 * Generate schedule config (JSONB)
 */
export const scheduleConfigArb = fc.oneof(
  fc.record({
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
  }),
  fc.record({
    dayOfWeek: fc.integer({ min: 0, max: 6 }),
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
  }),
  fc.record({
    branch: fc.string({ minLength: 1, maxLength: 100 }),
    debounceMinutes: fc.integer({ min: 1, max: 60 }),
  })
);

/**
 * Generate schedule records
 */
export const scheduleRecordArb = fc.record({
  id: fc.uuid(),
  repository_id: fc.uuid(),
  schedule_type: scheduleTypeArb,
  schedule_config: scheduleConfigArb,
  enabled: fc.boolean(),
  last_run_at: fc.option(fc.date()),
  next_run_at: fc.option(fc.date()),
  created_at: fc.date(),
  updated_at: fc.date(),
});

/**
 * Generate threshold records
 */
export const thresholdRecordArb = fc.record({
  id: fc.uuid(),
  repository_id: fc.uuid(),
  haunting_type: hauntingTypeArb,
  max_count: fc.nat(1000),
  severity: fc.option(severityArb),
  created_at: fc.date(),
  updated_at: fc.date(),
});

/**
 * Generate quality score (0-100)
 */
export const qualityScoreArb = fc.integer({ min: 0, max: 100 });

/**
 * Generate threshold status
 */
export const thresholdStatusArb = fc.oneof(
  fc.constant('passing'),
  fc.constant('failing')
);

/**
 * Generate scan with quality data
 */
export const scanWithQualityArb = fc.record({
  id: fc.uuid(),
  repository_id: fc.uuid(),
  status: fc.oneof(
    fc.constant('pending'),
    fc.constant('scanning'),
    fc.constant('completed'),
    fc.constant('failed')
  ),
  total_issues: fc.nat(1000),
  quality_score: fc.option(qualityScoreArb),
  threshold_status: fc.option(thresholdStatusArb),
  started_at: fc.date(),
  completed_at: fc.option(fc.date()),
});

/**
 * Generate issue with hash
 */
export const issueWithHashArb = fc.record({
  id: fc.uuid(),
  scan_id: fc.uuid(),
  haunting_type: hauntingTypeArb,
  severity: severityArb,
  file_path: fc.string({ minLength: 5, maxLength: 500 }),
  start_line: fc.integer({ min: 1, max: 10000 }),
  end_line: fc.integer({ min: 1, max: 10000 }),
  message: fc.string({ minLength: 10, maxLength: 1000 }),
  code_snippet: fc.string({ minLength: 10, maxLength: 5000 }),
  issue_hash: fc.option(issueHashArb),
  created_at: fc.date(),
}).filter(issue => issue.end_line >= issue.start_line);

/**
 * Generate export request
 */
export const exportRequestArb = fc.record({
  scanId: fc.uuid(),
  format: fc.oneof(fc.constant('json'), fc.constant('csv'), fc.constant('pdf')),
  includeAIExplanations: fc.boolean(),
  includeDismissed: fc.boolean(),
});

/**
 * Generate CSV row data
 */
export const csvRowArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 50 }),
  fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))
);

/**
 * Generate metrics for aggregation
 */
export const issueMetricsArb = fc.record({
  totalIssues: fc.nat(1000),
  issuesByType: fc.record({
    ghost: fc.nat(200),
    zombie: fc.nat(200),
    vampire: fc.nat(200),
    skeleton: fc.nat(200),
    monster: fc.nat(200),
  }),
  issuesBySeverity: fc.record({
    low: fc.nat(300),
    medium: fc.nat(300),
    high: fc.nat(300),
    critical: fc.nat(100),
  }),
});

/**
 * Generate file statistics
 */
export const fileStatsArb = fc.record({
  file_path: fc.string({ minLength: 5, maxLength: 500 }),
  issue_count: fc.nat(100),
  ghost_count: fc.nat(20),
  zombie_count: fc.nat(20),
  vampire_count: fc.nat(20),
  skeleton_count: fc.nat(20),
  monster_count: fc.nat(20),
});

/**
 * Generate threshold evaluation result
 */
export const thresholdEvaluationArb = fc.record({
  passing: fc.boolean(),
  thresholds: fc.array(thresholdRecordArb, { maxLength: 10 }),
  results: fc.array(
    fc.record({
      threshold_id: fc.uuid(),
      haunting_type: hauntingTypeArb,
      max_count: fc.nat(100),
      actual_count: fc.nat(150),
      exceeded: fc.boolean(),
      delta: fc.integer({ min: -100, max: 100 }),
    }),
    { maxLength: 10 }
  ),
});

/**
 * Generate notification payload
 */
export const notificationArb = fc.record({
  type: fc.oneof(
    fc.constant('regression'),
    fc.constant('threshold_exceeded'),
    fc.constant('scan_complete')
  ),
  scanId: fc.uuid(),
  repositoryId: fc.uuid(),
  message: fc.string({ minLength: 10, maxLength: 500 }),
  data: fc.dictionary(fc.string(), fc.anything()),
  timestamp: fc.date(),
});

/**
 * Generate cron expression
 */
export const cronExpressionArb = fc.oneof(
  fc.constant('0 2 * * *'), // Daily at 2 AM
  fc.constant('0 0 * * 0'), // Weekly on Sunday
  fc.constant('*/15 * * * *'), // Every 15 minutes
  fc.constant('0 */6 * * *'), // Every 6 hours
  fc.constant('0 9 * * 1-5') // Weekdays at 9 AM
);

/**
 * Generate time calculation inputs
 */
export const timeCalculationArb = fc.record({
  currentTime: fc.date(),
  scheduleType: scheduleTypeArb,
  config: scheduleConfigArb,
});

/**
 * Generate comparison data
 */
export const scanComparisonDataArb = fc.record({
  scan1Id: fc.uuid(),
  scan2Id: fc.uuid(),
  scan1Issues: fc.array(issueWithHashArb, { maxLength: 100 }),
  scan2Issues: fc.array(issueWithHashArb, { maxLength: 100 }),
});

