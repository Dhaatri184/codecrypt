/**
 * Feature enhancements test data generators for property-based testing
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
 * Generate issue objects
 */
export const issueArb = fc.record({
  id: fc.uuid(),
  scanId: fc.uuid(),
  hauntingType: hauntingTypeArb,
  severity: severityArb,
  filePath: fc.string({ minLength: 5, maxLength: 200 }),
  startLine: fc.integer({ min: 1, max: 1000 }),
  endLine: fc.integer({ min: 1, max: 1000 }),
  message: fc.string({ minLength: 10, maxLength: 500 }),
  codeSnippet: fc.string({ minLength: 10, maxLength: 1000 }),
  ruleId: fc.string({ minLength: 3, maxLength: 50 }),
  createdAt: fc.date(),
}).filter(issue => issue.endLine >= issue.startLine);

/**
 * Generate filter criteria
 */
export const filterCriteriaArb = fc.record({
  hauntingTypes: fc.array(hauntingTypeArb, { maxLength: 5 }),
  severities: fc.array(severityArb, { maxLength: 4 }),
  filePaths: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 10 }),
  searchTerm: fc.string({ maxLength: 100 }),
  showDismissed: fc.boolean(),
});

/**
 * Generate sort configurations
 */
export const sortConfigArb = fc.record({
  field: fc.oneof(
    fc.constant('severity'),
    fc.constant('filePath'),
    fc.constant('hauntingType'),
    fc.constant('lineNumber')
  ),
  direction: fc.oneof(fc.constant('asc'), fc.constant('desc')),
});

/**
 * Generate export formats
 */
export const exportFormatArb = fc.oneof(
  fc.constant('json'),
  fc.constant('csv'),
  fc.constant('pdf')
);

/**
 * Generate scan history entries
 */
export const scanHistoryEntryArb = fc.record({
  scanId: fc.uuid(),
  timestamp: fc.date(),
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
  qualityScore: fc.integer({ min: 0, max: 100 }),
});

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
 * Generate issue dismissals
 */
export const issueDismissalArb = fc.record({
  id: fc.uuid(),
  issueId: fc.uuid(),
  dismissedBy: fc.string({ minLength: 3, maxLength: 100 }),
  dismissedAt: fc.date(),
  reason: dismissalReasonArb,
  notes: fc.option(fc.string({ maxLength: 500 })),
  issueHash: fc.hexaString({ minLength: 64, maxLength: 64 }),
});

/**
 * Generate issue notes
 */
export const issueNoteArb = fc.record({
  id: fc.uuid(),
  issueId: fc.uuid(),
  author: fc.string({ minLength: 3, maxLength: 100 }),
  content: fc.string({ minLength: 1, maxLength: 2000 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

/**
 * Generate schedule types
 */
export const scheduleTypeArb = fc.oneof(
  fc.constant('daily'),
  fc.constant('weekly'),
  fc.constant('on_push')
);

/**
 * Generate schedule configurations
 */
export const scheduleConfigArb = fc.oneof(
  // Daily config
  fc.record({
    type: fc.constant('daily'),
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
  }),
  // Weekly config
  fc.record({
    type: fc.constant('weekly'),
    dayOfWeek: fc.integer({ min: 0, max: 6 }),
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
  }),
  // On-push config
  fc.record({
    type: fc.constant('on_push'),
    branch: fc.oneof(fc.constant('main'), fc.constant('master'), fc.constant('develop')),
    debounceMinutes: fc.integer({ min: 1, max: 60 }),
  })
);

/**
 * Generate scan schedules
 */
export const scanScheduleArb = fc.record({
  id: fc.uuid(),
  repositoryId: fc.uuid(),
  scheduleType: scheduleTypeArb,
  scheduleConfig: scheduleConfigArb,
  enabled: fc.boolean(),
  lastRunAt: fc.option(fc.date()),
  nextRunAt: fc.option(fc.date()),
});

/**
 * Generate quality thresholds
 */
export const qualityThresholdArb = fc.record({
  id: fc.uuid(),
  repositoryId: fc.uuid(),
  hauntingType: hauntingTypeArb,
  maxCount: fc.nat(100),
  severity: fc.option(severityArb),
});

/**
 * Generate quality scores
 */
export const qualityScoreArb = fc.record({
  score: fc.integer({ min: 0, max: 100 }),
  breakdown: fc.record({
    ghosts: fc.integer({ min: 0, max: 100 }),
    zombies: fc.integer({ min: 0, max: 100 }),
    vampires: fc.integer({ min: 0, max: 100 }),
    skeletons: fc.integer({ min: 0, max: 100 }),
    monsters: fc.integer({ min: 0, max: 100 }),
  }),
  grade: fc.oneof(
    fc.constant('A'),
    fc.constant('B'),
    fc.constant('C'),
    fc.constant('D'),
    fc.constant('F')
  ),
});

/**
 * Generate file statistics
 */
export const fileStatisticsArb = fc.record({
  filePath: fc.string({ minLength: 5, maxLength: 200 }),
  issueCount: fc.nat(100),
  issuesByType: fc.record({
    ghost: fc.nat(20),
    zombie: fc.nat(20),
    vampire: fc.nat(20),
    skeleton: fc.nat(20),
    monster: fc.nat(20),
  }),
  linesOfCode: fc.nat(10000),
}).map(stat => ({
  ...stat,
  issuesPerLOC: stat.linesOfCode > 0 ? stat.issueCount / stat.linesOfCode : 0,
}));

/**
 * Generate trend data
 */
export const trendDataArb = fc.record({
  timestamps: fc.array(fc.date(), { minLength: 2, maxLength: 50 }),
  totalIssues: fc.array(fc.nat(1000), { minLength: 2, maxLength: 50 }),
  issuesByType: fc.record({
    ghost: fc.array(fc.nat(200), { minLength: 2, maxLength: 50 }),
    zombie: fc.array(fc.nat(200), { minLength: 2, maxLength: 50 }),
    vampire: fc.array(fc.nat(200), { minLength: 2, maxLength: 50 }),
    skeleton: fc.array(fc.nat(200), { minLength: 2, maxLength: 50 }),
    monster: fc.array(fc.nat(200), { minLength: 2, maxLength: 50 }),
  }),
  qualityScores: fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 50 }),
}).filter(data => 
  data.timestamps.length === data.totalIssues.length &&
  data.timestamps.length === data.qualityScores.length
);

/**
 * Generate scan comparison data
 */
export const scanComparisonArb = fc.record({
  scan1: scanHistoryEntryArb,
  scan2: scanHistoryEntryArb,
  newIssues: fc.array(issueArb, { maxLength: 50 }),
  resolvedIssues: fc.array(issueArb, { maxLength: 50 }),
  unchangedIssues: fc.array(issueArb, { maxLength: 100 }),
}).map(comparison => ({
  ...comparison,
  scoreDelta: comparison.scan2.qualityScore - comparison.scan1.qualityScore,
  issueCountDelta: comparison.scan2.totalIssues - comparison.scan1.totalIssues,
}));

/**
 * Generate theme preferences
 */
export const themeArb = fc.oneof(
  fc.constant('light'),
  fc.constant('dark')
);

/**
 * Generate keyboard shortcuts
 */
export const keyboardShortcutArb = fc.record({
  key: fc.oneof(
    fc.constant('/'),
    fc.constant('n'),
    fc.constant('p'),
    fc.constant('?'),
    fc.constant('Escape')
  ),
  action: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
});

/**
 * Generate code context
 */
export const codeContextArb = fc.record({
  before: fc.array(fc.string({ maxLength: 200 }), { minLength: 0, maxLength: 5 }),
  issue: fc.array(fc.string({ maxLength: 200 }), { minLength: 1, maxLength: 10 }),
  after: fc.array(fc.string({ maxLength: 200 }), { minLength: 0, maxLength: 5 }),
});

/**
 * Generate AI fix suggestions
 */
export const aiFixSuggestionArb = fc.record({
  explanation: fc.string({ minLength: 50, maxLength: 1000 }),
  fixCode: fc.string({ minLength: 10, maxLength: 500 }),
  alternatives: fc.array(
    fc.record({
      description: fc.string({ minLength: 20, maxLength: 200 }),
      code: fc.string({ minLength: 10, maxLength: 500 }),
    }),
    { maxLength: 3 }
  ),
});

