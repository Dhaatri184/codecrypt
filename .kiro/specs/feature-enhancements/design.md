# Design Document

## Overview

This design document outlines the implementation of 15 major feature enhancements to the CodeCrypt system. These features significantly improve user experience, add powerful analytics capabilities, and make the application production-ready for team use. The enhancements are organized into five categories:

1. **Filtering and Search** - Advanced issue filtering, sorting, and search capabilities
2. **Data Export and Reporting** - Export scan results in multiple formats (JSON, CSV, PDF)
3. **Historical Analysis** - Scan history, trend visualization, and comparison tools
4. **Workflow Enhancements** - Issue dismissal, notes, scheduled scans, quality gates
5. **UX Improvements** - Dark mode, keyboard shortcuts, better code display, enhanced AI suggestions

All features integrate seamlessly with the existing architecture and maintain the spooky theme.

## Architecture

### Frontend Architecture Additions

```
frontend/src/
├── components/
│   ├── filters/
│   │   ├── IssueFilters.tsx       # Filter controls
│   │   ├── IssueSorter.tsx        # Sort controls
│   │   └── SearchBar.tsx          # Search input
│   ├── export/
│   │   ├── ExportButton.tsx       # Export trigger
│   │   └── ExportModal.tsx        # Format selection
│   ├── history/
│   │   ├── ScanHistory.tsx        # Historical scan list
│   │   ├── TrendChart.tsx         # Trend visualization
│   │   └── ScanComparison.tsx     # Side-by-side comparison
│   ├── dashboard/
│   │   ├── MetricsDashboard.tsx   # Summary statistics
│   │   ├── QualityScore.tsx       # Score display
│   │   └── FileRanking.tsx        # Top problematic files
│   ├── issues/
│   │   ├── IssueCard.tsx          # Enhanced with dismiss/notes
│   │   ├── CodeContext.tsx        # Code display with highlighting
│   │   ├── IssueNotes.tsx         # Notes interface
│   │   └── DismissModal.tsx       # Dismissal dialog
│   ├── theme/
│   │   └── ThemeToggle.tsx        # Dark/light mode toggle
│   └── keyboard/
│       └── ShortcutsHelp.tsx      # Keyboard shortcuts modal
├── hooks/
│   ├── useFilters.ts              # Filter state management
│   ├── useSorting.ts              # Sort state management
│   ├── useKeyboardShortcuts.ts    # Keyboard event handling
│   └── useTheme.ts                # Theme management
├── utils/
│   ├── exporters/
│   │   ├── jsonExporter.ts        # JSON export logic
│   │   ├── csvExporter.ts         # CSV export logic
│   │   └── pdfExporter.ts         # PDF generation
│   ├── filters.ts                 # Filter logic
│   ├── sorting.ts                 # Sort logic
│   ├── qualityScore.ts            # Score calculation
│   └── scanComparison.ts          # Scan diff logic
└── styles/
    └── themes/
        ├── light.css              # Light theme
        └── dark.css               # Dark theme
```

### Backend Architecture Additions

```
backend/src/
├── routes/
│   ├── export.ts                  # Export endpoints
│   ├── history.ts                 # Scan history endpoints
│   ├── dismissals.ts              # Issue dismissal endpoints
│   ├── notes.ts                   # Issue notes endpoints
│   └── schedules.ts               # Scan scheduling endpoints
├── services/
│   ├── exportService.ts           # Export generation
│   ├── trendService.ts            # Trend calculation
│   ├── comparisonService.ts       # Scan comparison
│   ├── qualityScoreService.ts     # Score calculation
│   └── schedulerService.ts        # Cron job management
├── db/
│   ├── repositories/
│   │   ├── dismissals.ts          # Dismissal data access
│   │   ├── notes.ts               # Notes data access
│   │   ├── schedules.ts           # Schedule data access
│   │   └── thresholds.ts          # Quality gate data access
└── workers/
    └── scheduledScanWorker.ts     # Scheduled scan processor
```

### Database Schema Additions

```sql
-- Issue dismissals
CREATE TABLE issue_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id),
  dismissed_by VARCHAR(255) NOT NULL,
  dismissed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reason VARCHAR(50) NOT NULL,
  notes TEXT,
  issue_hash VARCHAR(64) NOT NULL,  -- Hash of issue content for change detection
  UNIQUE(issue_id)
);

-- Issue notes
CREATE TABLE issue_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id),
  author VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Scan schedules
CREATE TABLE scan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id),
  schedule_type VARCHAR(20) NOT NULL,  -- 'daily', 'weekly', 'on_push'
  schedule_config JSONB NOT NULL,      -- { hour: 2, dayOfWeek: 1, etc }
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(repository_id)
);

-- Quality thresholds
CREATE TABLE quality_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id),
  haunting_type VARCHAR(20) NOT NULL,
  max_count INTEGER NOT NULL,
  severity VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(repository_id, haunting_type, severity)
);

-- Add quality score to scans table
ALTER TABLE scans ADD COLUMN quality_score INTEGER;  -- 0-100
ALTER TABLE scans ADD COLUMN threshold_status VARCHAR(20);  -- 'passing', 'failing', null
```

## Components and Interfaces

### Filter and Search Interfaces

```typescript
interface IssueFilters {
  hauntingTypes: HauntingType[];  // Empty = all
  severities: Severity[];         // Empty = all
  filePaths: string[];            // Empty = all
  searchTerm: string;             // Empty = no search
  showDismissed: boolean;
}

interface FilteredIssues {
  issues: Issue[];
  totalCount: number;
  filteredCount: number;
}

interface SortConfig {
  field: 'severity' | 'filePath' | 'hauntingType' | 'lineNumber';
  direction: 'asc' | 'desc';
}
```

### Export Interfaces

```typescript
interface ExportRequest {
  scanId: string;
  format: 'json' | 'csv' | 'pdf';
  includeAIExplanations: boolean;
  includeDismissed: boolean;
}

interface ExportResult {
  filename: string;
  mimeType: string;
  data: Buffer | string;
  size: number;
}

interface PDFReportConfig {
  title: string;
  includeSummary: boolean;
  includeCharts: boolean;
  includeCodeSnippets: boolean;
}
```

### History and Trends Interfaces

```typescript
interface ScanHistoryEntry {
  scanId: string;
  timestamp: Date;
  totalIssues: number;
  issuesByType: Record<HauntingType, number>;
  issuesBySeverity: Record<Severity, number>;
  qualityScore: number;
}

interface TrendData {
  timestamps: Date[];
  totalIssues: number[];
  issuesByType: Record<HauntingType, number[]>;
  qualityScores: number[];
}

interface ScanComparison {
  scan1: ScanHistoryEntry;
  scan2: ScanHistoryEntry;
  newIssues: Issue[];
  resolvedIssues: Issue[];
  unchangedIssues: Issue[];
  scoreDelta: number;
  issueCountDelta: number;
}
```

### Dismissal and Notes Interfaces

```typescript
interface IssueDismissal {
  id: string;
  issueId: string;
  dismissedBy: string;
  dismissedAt: Date;
  reason: 'false_positive' | 'wont_fix' | 'accepted_risk' | 'planned' | 'other';
  notes?: string;
  issueHash: string;
}

interface IssueNote {
  id: string;
  issueId: string;
  author: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Scheduling Interfaces

```typescript
interface ScanSchedule {
  id: string;
  repositoryId: string;
  scheduleType: 'daily' | 'weekly' | 'on_push';
  scheduleConfig: DailyConfig | WeeklyConfig | OnPushConfig;
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

interface DailyConfig {
  hour: number;  // 0-23
  minute: number;  // 0-59
}

interface WeeklyConfig {
  dayOfWeek: number;  // 0-6 (Sunday-Saturday)
  hour: number;
  minute: number;
}

interface OnPushConfig {
  branch: string;  // 'main', 'develop', etc.
  debounceMinutes: number;  // Wait time after push
}
```

### Quality Gate Interfaces

```typescript
interface QualityThreshold {
  id: string;
  repositoryId: string;
  hauntingType: HauntingType;
  maxCount: number;
  severity?: Severity;  // Optional: threshold for specific severity
}

interface ThresholdEvaluation {
  passing: boolean;
  thresholds: QualityThreshold[];
  results: ThresholdResult[];
}

interface ThresholdResult {
  threshold: QualityThreshold;
  actualCount: number;
  exceeded: boolean;
  delta: number;
}
```

### Dashboard Interfaces

```typescript
interface DashboardMetrics {
  totalIssues: number;
  issuesByType: Record<HauntingType, number>;
  issuesBySeverity: Record<Severity, number>;
  qualityScore: number;
  topProblematicFiles: FileStatistics[];
  comparisonToPrevious?: {
    issuesDelta: number;
    scoreDelta: number;
  };
}

interface FileStatistics {
  filePath: string;
  issueCount: number;
  issuesByType: Record<HauntingType, number>;
  linesOfCode: number;
  issuesPerLOC: number;
}
```

## Data Models

### Enhanced Issue Model

```typescript
interface Issue {
  // Existing fields
  id: string;
  scanId: string;
  hauntingType: HauntingType;
  severity: Severity;
  filePath: string;
  startLine: number;
  endLine: number;
  message: string;
  codeSnippet: string;
  
  // New fields
  dismissal?: IssueDismissal;
  notes: IssueNote[];
  codeContext: {
    before: string[];  // 5 lines before
    issue: string[];   // The problematic lines
    after: string[];   // 5 lines after
  };
  issueHash: string;  // For change detection
}
```

### Quality Score Model

```typescript
interface QualityScore {
  score: number;  // 0-100
  breakdown: {
    ghosts: number;      // Weight: 15
    zombies: number;     // Weight: 20
    vampires: number;    // Weight: 25
    skeletons: number;   // Weight: 20
    monsters: number;    // Weight: 20
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Filtering and Search Properties

**Property 1: Filter correctness**
*For any* set of issues and any filter criteria, all issues returned after filtering should match the filter criteria for haunting type, severity, and file path.
**Validates: Requirements 1.2**

**Property 2: Search term matching**
*For any* set of issues and any search term, all issues returned should contain the search term in at least one of: file path, message, or code snippet.
**Validates: Requirements 1.3**

**Property 3: Filter count accuracy**
*For any* set of issues and any applied filters, the displayed filtered count should equal the number of issues matching the filters, and total count should equal all issues.
**Validates: Requirements 1.4**

**Property 4: Filter clear restoration**
*For any* set of issues, applying filters then clearing them should return the exact same set of issues in the same order.
**Validates: Requirements 1.5**

### Sorting Properties

**Property 5: Sort order correctness**
*For any* list of issues and any sort criteria, the sorted list should be properly ordered according to the specified field and direction.
**Validates: Requirements 2.2**

**Property 6: Severity sort order**
*For any* list of issues sorted by severity, the order should be: Critical, High, Medium, Low.
**Validates: Requirements 2.3**

**Property 7: Alphabetical sort order**
*For any* list of issues sorted by file path, the file paths should be in alphabetical order.
**Validates: Requirements 2.4**

**Property 8: Sort persistence**
*For any* applied sort preference, navigating away and returning should preserve the same sort order.
**Validates: Requirements 2.5**

### Export Properties

**Property 9: JSON export completeness**
*For any* set of issues exported to JSON, all issue fields should be present in the exported data.
**Validates: Requirements 3.2**

**Property 10: CSV format validity**
*For any* set of issues exported to CSV, the output should be valid CSV format parseable by standard CSV libraries.
**Validates: Requirements 3.3**

**Property 11: PDF generation success**
*For any* set of issues exported to PDF, the generated PDF should contain summary statistics and the issue list.
**Validates: Requirements 3.4**

### History and Trends Properties

**Property 12: Historical scan completeness**
*For any* repository with scans, all scans should appear in the history list with dates and issue counts.
**Validates: Requirements 4.1**

**Property 13: Trend calculation accuracy**
*For any* sequence of scans, the trend data should accurately reflect the issue counts over time.
**Validates: Requirements 4.2**

**Property 14: Issue type breakdown accuracy**
*For any* scan, the sum of issues by type should equal the total issue count.
**Validates: Requirements 4.3**

**Property 15: Scan comparison categorization**
*For any* two scans being compared, every issue should be categorized as exactly one of: new, resolved, or unchanged.
**Validates: Requirements 4.4**

**Property 16: Regression indication**
*For any* two consecutive scans where issue count increases, the regression indicator should be displayed.
**Validates: Requirements 4.5**

### Dismissal Properties

**Property 17: Dismissed issue filtering**
*For any* set of issues with some dismissed, the default view should not include dismissed issues.
**Validates: Requirements 5.2**

**Property 18: Dismissal data completeness**
*For any* dismissed issue, the dismissal record should contain reason, timestamp, and dismissing user.
**Validates: Requirements 5.3**

**Property 19: Dismissal change detection**
*For any* dismissed issue, if the issue content changes (different hash), the dismissal should be cleared.
**Validates: Requirements 5.5**

### Code Display Properties

**Property 20: Syntax highlighting presence**
*For any* issue with code, the displayed code should include syntax highlighting.
**Validates: Requirements 6.1**

**Property 21: Context line count**
*For any* issue displayed with context, there should be exactly 5 lines before and 5 lines after (or fewer if at file boundaries).
**Validates: Requirements 6.2**

**Property 22: Issue line highlighting**
*For any* displayed issue, the specific lines with the issue should be visually highlighted.
**Validates: Requirements 6.3**

**Property 23: Expand/collapse for long code**
*For any* code snippet exceeding 20 lines, expand/collapse functionality should be available.
**Validates: Requirements 6.5**

### Dashboard Properties

**Property 24: Metric aggregation accuracy**
*For any* scan, the dashboard metrics should accurately reflect total issues, issues by type, and issues by severity.
**Validates: Requirements 7.2**

**Property 25: Quality score bounds**
*For any* calculated quality score, it should be between 0 and 100 inclusive.
**Validates: Requirements 7.3**

**Property 26: File ranking correctness**
*For any* set of files, the most problematic files should be ranked in descending order by issue count.
**Validates: Requirements 7.4**

**Property 27: Delta calculation accuracy**
*For any* two consecutive scans, the delta indicators should correctly show the difference in issue counts and scores.
**Validates: Requirements 7.5**

### Notes Properties

**Property 28: Note data completeness**
*For any* added note, it should be stored with content, timestamp, and author.
**Validates: Requirements 8.2**

**Property 29: Note chronological ordering**
*For any* set of notes on an issue, they should be displayed in chronological order by timestamp.
**Validates: Requirements 8.3**

**Property 30: Note field display**
*For any* displayed note, it should show the author and timestamp.
**Validates: Requirements 8.4**

**Property 31: Note persistence across scans**
*For any* note on an issue, it should remain associated with that issue across subsequent scans until the issue is resolved.
**Validates: Requirements 8.5**

### File Statistics Properties

**Property 32: File issue count accuracy**
*For any* file, the displayed issue count should equal the number of issues in that file.
**Validates: Requirements 10.2**

**Property 33: File type distribution accuracy**
*For any* file, the distribution of issue types should accurately reflect the issues in that file.
**Validates: Requirements 10.3**

**Property 34: File filtering correctness**
*For any* selected file, only issues from that file should be displayed.
**Validates: Requirements 10.4**

**Property 35: File sorting correctness**
*For any* sort criterion (issue count, name, size), files should be correctly ordered.
**Validates: Requirements 10.5**

### Scheduling Properties

**Property 36: Scheduled scan execution**
*For any* scheduled scan, it should execute within 1 minute of the scheduled time.
**Validates: Requirements 11.3**

**Property 37: Notification on regression**
*For any* scheduled scan where issues increase, a notification should be sent.
**Validates: Requirements 11.4**

**Property 38: Next run time calculation**
*For any* schedule configuration, the next run time should be correctly calculated based on the schedule type and config.
**Validates: Requirements 11.5**

### Quality Gate Properties

**Property 39: Threshold evaluation correctness**
*For any* scan and configured thresholds, the evaluation should correctly identify which thresholds are exceeded.
**Validates: Requirements 12.2**

**Property 40: Failing scan marking**
*For any* scan where thresholds are exceeded, the scan should be marked as "failing".
**Validates: Requirements 12.3**

**Property 41: Threshold summary completeness**
*For any* failing scan, the summary should list all exceeded thresholds.
**Validates: Requirements 12.4**

**Property 42: Passing scan marking**
*For any* scan where all thresholds are met, the scan should be marked as "passing".
**Validates: Requirements 12.5**

### Theme Properties

**Property 43: Theme state persistence**
*For any* theme change, the preference should be saved to local storage and restored on next load.
**Validates: Requirements 13.4**

### AI Suggestion Properties

**Property 44: Fix code syntax highlighting**
*For any* AI fix suggestion containing code, the code should be displayed with syntax highlighting.
**Validates: Requirements 14.2**

**Property 45: Multiple fix options display**
*For any* issue with multiple AI fix suggestions, all options should be displayed.
**Validates: Requirements 14.4**

### Comparison Properties

**Property 46: Comparison categorization completeness**
*For any* two scans being compared, every issue should appear in exactly one category: new, resolved, or unchanged.
**Validates: Requirements 15.2**

**Property 47: Comparison delta accuracy**
*For any* two scans, the displayed differences in issue counts by type should accurately reflect the actual differences.
**Validates: Requirements 15.3**

**Property 48: Specific issue diff correctness**
*For any* comparison, the specific issues listed as added or removed should be correct.
**Validates: Requirements 15.4**

**Property 49: Quality score delta accuracy**
*For any* two scans, the net change in quality score should be correctly calculated.
**Validates: Requirements 15.5**

## Error Handling

### Filter and Search Errors
- Invalid filter criteria → Return all issues with warning
- Search timeout → Return partial results with indicator
- Empty result set → Display helpful message suggesting filter adjustment

### Export Errors
- PDF generation failure → Offer JSON/CSV alternatives
- File too large → Offer filtered export or chunked download
- Browser download blocked → Provide direct link

### History and Comparison Errors
- Missing scan data → Display partial history with gaps indicated
- Comparison of incompatible scans → Show error with explanation
- Trend calculation failure → Fall back to simple list view

### Scheduling Errors
- Cron expression invalid → Validate and show error immediately
- Scheduled scan fails → Retry once, then notify user
- Concurrent schedule conflicts → Queue scans sequentially

### Quality Gate Errors
- Threshold configuration invalid → Validate on save
- Evaluation failure → Mark as "unknown" status
- Missing baseline scan → Use first scan as baseline

## Testing Strategy

### Unit Testing

**Filter and Sort Logic:**
- Test filter functions with various criteria combinations
- Test sort functions with different field types
- Test edge cases (empty lists, single item, all same values)

**Export Functions:**
- Test JSON serialization with complex objects
- Test CSV generation with special characters
- Test PDF generation with various data sizes

**Calculation Functions:**
- Test quality score calculation with different issue distributions
- Test trend calculation with various time series
- Test comparison logic with overlapping and non-overlapping scans

**Validation:**
- Test schedule configuration validation
- Test threshold configuration validation
- Test input sanitization

### Property-Based Testing

**Library**: fast-check (minimum 100 iterations per property)

**Test Organization**:
- Each correctness property gets its own test file
- Tests tagged with property number and requirement
- Generators for all domain objects
- Shrinking enabled for minimal failing cases

**Key Generators**:
```typescript
// Generate random issues
const issueArb = fc.record({
  id: fc.uuid(),
  hauntingType: fc.constantFrom('ghost', 'zombie', 'vampire', 'skeleton', 'monster'),
  severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
  filePath: fc.string(),
  startLine: fc.nat(1000),
  endLine: fc.nat(1000),
  message: fc.string(),
  codeSnippet: fc.string()
});

// Generate filter criteria
const filterArb = fc.record({
  hauntingTypes: fc.array(fc.constantFrom('ghost', 'zombie', 'vampire', 'skeleton', 'monster')),
  severities: fc.array(fc.constantFrom('low', 'medium', 'high', 'critical')),
  filePaths: fc.array(fc.string()),
  searchTerm: fc.string()
});

// Generate scan history
const scanHistoryArb = fc.array(fc.record({
  scanId: fc.uuid(),
  timestamp: fc.date(),
  totalIssues: fc.nat(1000),
  qualityScore: fc.integer(0, 100)
}), { minLength: 2, maxLength: 50 });

// Generate quality thresholds
const thresholdArb = fc.record({
  hauntingType: fc.constantFrom('ghost', 'zombie', 'vampire', 'skeleton', 'monster'),
  maxCount: fc.nat(100),
  severity: fc.option(fc.constantFrom('low', 'medium', 'high', 'critical'))
});
```

### Integration Testing

**End-to-End Workflows:**
- Filter → Sort → Export workflow
- Scan → Compare → Export workflow
- Schedule → Execute → Evaluate thresholds workflow
- Dismiss issue → Add note → Verify persistence workflow

**API Integration:**
- Test all new endpoints with various payloads
- Test error responses and status codes
- Test authentication and authorization
- Test rate limiting on export endpoints

### UI Testing

**Component Testing:**
- Test filter controls update state correctly
- Test sort controls trigger re-ordering
- Test export button triggers download
- Test theme toggle changes styles
- Test keyboard shortcuts trigger actions

**Visual Regression:**
- Test dark mode styling
- Test responsive layouts
- Test chart rendering
- Test PDF output formatting

## Implementation Phases

### Phase 1: Filtering and Search (Week 1)
- Implement filter state management
- Create filter UI components
- Implement search functionality
- Add sort controls and logic
- Write property tests for filtering and sorting

### Phase 2: Export Functionality (Week 1-2)
- Implement JSON exporter
- Implement CSV exporter
- Implement PDF generator with charts
- Create export UI and download handling
- Write property tests for export formats

### Phase 3: History and Trends (Week 2)
- Implement scan history retrieval
- Create trend calculation service
- Build trend visualization component
- Implement scan comparison logic
- Write property tests for history and comparison

### Phase 4: Dashboard and Metrics (Week 2-3)
- Implement quality score calculation
- Create dashboard components
- Build file statistics view
- Add metric comparison to previous scan
- Write property tests for metrics

### Phase 5: Dismissal and Notes (Week 3)
- Implement dismissal database operations
- Create dismissal UI and modal
- Implement notes database operations
- Build notes interface
- Add change detection for dismissed issues
- Write property tests for dismissal and notes

### Phase 6: Scheduling and Quality Gates (Week 3-4)
- Implement cron-based scheduler
- Create schedule configuration UI
- Implement threshold configuration
- Build threshold evaluation service
- Add notification system
- Write property tests for scheduling and thresholds

### Phase 7: UX Enhancements (Week 4)
- Implement dark mode with theme toggle
- Add keyboard shortcuts
- Enhance code display with context
- Improve AI suggestion display
- Write property tests for theme and UI

### Phase 8: Testing and Polish (Week 4-5)
- Write integration tests for all workflows
- Perform UI testing and visual regression
- Optimize performance
- Fix bugs and edge cases
- Update documentation

## Performance Considerations

### Filtering and Sorting
- Use memoization for filter results
- Implement virtual scrolling for large issue lists
- Debounce search input (300ms)
- Cache sort results

### Export
- Stream large exports instead of loading all in memory
- Generate PDFs asynchronously with progress indicator
- Limit export size (max 10,000 issues)
- Compress large exports

### History and Trends
- Paginate scan history (20 per page)
- Cache trend calculations (1 hour TTL)
- Lazy load comparison data
- Limit trend chart to last 30 scans

### Dashboard
- Cache dashboard metrics (5 minutes TTL)
- Compute quality scores asynchronously
- Limit file ranking to top 20 files
- Use database aggregation for counts

### Scheduling
- Use efficient cron library (node-cron)
- Limit concurrent scheduled scans (max 5)
- Queue overflow scans
- Clean up old schedule records (> 90 days)

## Security Considerations

### Export Security
- Validate user has access to scan before export
- Sanitize data in exports to prevent injection
- Rate limit export requests (5 per minute per user)
- Log all export operations for audit

### Dismissal and Notes
- Validate user has access to repository
- Sanitize note content to prevent XSS
- Rate limit note creation (10 per minute)
- Store author information for accountability

### Scheduling
- Validate schedule configuration
- Require authentication for schedule management
- Limit number of schedules per repository (1)
- Validate cron expressions to prevent abuse

### Quality Gates
- Validate threshold values are reasonable
- Require repository access for threshold management
- Log threshold changes for audit
- Prevent threshold manipulation during scans

## Monitoring and Observability

### Metrics to Track
- Filter usage patterns
- Export format popularity
- Average export generation time
- Scheduled scan success rate
- Quality gate pass/fail rates
- Theme preference distribution
- Keyboard shortcut usage

### Logging
- Log all export operations with size and format
- Log scheduled scan executions
- Log quality gate evaluations
- Log dismissal and note operations
- Log errors in PDF generation

### Alerts
- Alert on export generation failures
- Alert on scheduled scan failures
- Alert on quality gate threshold breaches
- Alert on high dismissal rates (potential issue)

