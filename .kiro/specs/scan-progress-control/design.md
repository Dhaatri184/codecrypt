# Design Document: Scan Progress and Control

## Overview

This feature adds real-time progress tracking and cancellation capabilities to the repository scanning system. The design extends the existing scanner, backend worker, and WebSocket infrastructure to provide users with visibility into scan progress and the ability to stop long-running scans.

The implementation leverages the existing Bull queue system for job management, WebSocket connections for real-time updates, and adds new database fields to track progress and cancellation state.

## Architecture

### High-Level Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │◄────────┤   Backend    │◄────────┤   Scanner   │
│             │ WebSocket│              │  Queue  │   Worker    │
│  - Progress │         │  - Progress  │         │  - Track    │
│    Bar      │         │    Tracking  │         │    Progress │
│  - Stop Btn │         │  - Cancel    │         │  - Check    │
│             │         │    Handler   │         │    Cancel   │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         │
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌─────────────┐
                        │   Database   │         │    Redis    │
                        │  - Progress  │         │  - Cancel   │
                        │    Fields    │         │    Flags    │
                        └──────────────┘         └─────────────┘
```

### Component Interactions

1. **Scanner Worker** tracks progress and periodically updates the database
2. **Backend** receives progress updates and broadcasts via WebSocket
3. **Frontend** displays progress and sends cancellation requests
4. **Redis** stores cancellation flags for immediate worker notification
5. **Database** persists progress state for recovery and history

## Components and Interfaces

### 1. Database Schema Changes

Add new fields to the `scans` table:

```sql
ALTER TABLE scans ADD COLUMN progress_percentage INTEGER DEFAULT 0;
ALTER TABLE scans ADD COLUMN files_processed INTEGER DEFAULT 0;
ALTER TABLE scans ADD COLUMN total_files_discovered INTEGER DEFAULT 0;
ALTER TABLE scans ADD COLUMN current_status_message TEXT;
ALTER TABLE scans ADD COLUMN cancelled_at TIMESTAMP;
```

Update `ScanStatus` type to include 'cancelled':

```typescript
export type ScanStatus = 'pending' | 'scanning' | 'analyzing' | 'completed' | 'failed' | 'cancelled';
```

### 2. Scanner Progress Tracking

The scanner will be modified to:

- Track files processed vs total files
- Calculate progress percentage
- Report progress at regular intervals (every 1 second or every 10 files, whichever comes first)
- Check for cancellation flags between batches
- Save partial results on cancellation

```typescript
interface ProgressUpdate {
  scanId: string;
  filesProcessed: number;
  totalFiles: number;
  progressPercentage: number;
  statusMessage: string;
}

interface ScannerCallbacks {
  onProgress?: (update: ProgressUpdate) => Promise<void>;
  shouldCancel?: () => Promise<boolean>;
}
```

### 3. Backend API Endpoints

**New endpoint: Cancel Scan**

```
POST /api/scans/:id/cancel
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "scanId": "...",
    "status": "cancelled"
  }
}
```

**Enhanced WebSocket events:**

```typescript
// Progress update event
{
  type: 'scan_progress',
  payload: {
    scanId: string;
    progressPercentage: number;
    filesProcessed: number;
    totalFiles: number;
    statusMessage: string;
  },
  timestamp: Date;
}

// Cancellation event
{
  type: 'scan_cancelled',
  payload: {
    scanId: string;
    partialResults: {
      filesProcessed: number;
      issuesFound: number;
    }
  },
  timestamp: Date;
}
```

### 4. Redis Cancellation Flags

Use Redis for fast cancellation signaling:

```typescript
// Set cancellation flag
await redis.set(`scan:${scanId}:cancel`, '1', 'EX', 3600);

// Check cancellation flag
const cancelled = await redis.get(`scan:${scanId}:cancel`);
```

### 5. Frontend Components

**Progress Display Component:**

```typescript
interface ScanProgressProps {
  scanId: string;
  status: ScanStatus;
  progressPercentage: number;
  filesProcessed: number;
  totalFiles: number;
  statusMessage: string;
  onCancel: () => void;
}
```

**Features:**
- Animated progress bar (0-100%)
- File count display (X of Y files)
- Status message display
- Stop button (visible only when status is 'scanning' or 'analyzing')
- Visual states for different statuses (scanning, cancelled, failed, completed)

## Data Models

### Updated Scan Interface

```typescript
export interface Scan {
  id: string;
  repositoryId: string;
  status: ScanStatus;
  commitSha?: string;
  totalFiles?: number;
  totalIssues?: number;
  hauntingLevel?: string;
  
  // New fields
  progressPercentage: number;
  filesProcessed: number;
  totalFilesDiscovered: number;
  currentStatusMessage?: string;
  cancelledAt?: Date;
  
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}
```

### Progress Tracking State

```typescript
interface ScanProgress {
  scanId: string;
  totalFiles: number;
  filesProcessed: number;
  lastUpdateTime: number;
  batchStartIndex: number;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 1.1, 1.3, and 1.4 all test progress percentage bounds and can be combined into a single "progress bounds" property
- Properties 2.1 and 2.6 both test button visibility and can be combined into a single "button visibility" property
- Properties 5.3 and 5.4 both test visual state mapping and can be combined into a single "status-to-visual-state" property

### Core Properties

**Property 1: Progress percentage bounds**
*For any* scan, the progress percentage should always be between 0 and 100 inclusive, with pending scans at 0% and completed scans at 100%
**Validates: Requirements 1.1, 1.3, 1.4**

**Property 2: Progress monotonicity**
*For any* sequence of progress updates for a scan, the progress percentage should never decrease (monotonically increasing)
**Validates: Requirements 1.2**

**Property 3: Progress update structure**
*For any* progress update message, it should contain both filesProcessed and totalFiles fields with non-negative integer values
**Validates: Requirements 1.5**

**Property 4: Stop button visibility**
*For any* scan, the stop button should be visible/enabled if and only if the scan status is 'scanning' or 'analyzing'
**Validates: Requirements 2.1, 2.6**

**Property 5: Cancellation triggers API call**
*For any* stop button click event, a cancellation API request should be sent to the backend with the correct scan ID
**Validates: Requirements 2.2**

**Property 6: Cancellation stops processing**
*For any* scan, when a cancellation flag is set, the scanner should stop processing new files within one batch interval
**Validates: Requirements 2.3, 4.4**

**Property 7: Cancellation updates status**
*For any* scan that receives a cancellation request, the final scan status should be 'cancelled'
**Validates: Requirements 2.4**

**Property 8: Partial results persistence**
*For any* cancelled scan, all issues discovered before cancellation should be persisted in the database
**Validates: Requirements 2.5**

**Property 9: Status message format during scanning**
*For any* scan in 'scanning' status, the status message should match the pattern "Scanning files... X of Y" where X ≤ Y
**Validates: Requirements 3.3**

**Property 10: Database update throttling**
*For any* sequence of progress updates, database writes should occur at most once per second
**Validates: Requirements 4.1, 4.2**

**Property 11: WebSocket update throttling**
*For any* sequence of progress updates, WebSocket broadcasts should be throttled to at most 2 updates per second
**Validates: Requirements 4.3**

**Property 12: Progress calculation accuracy**
*For any* progress update, the reported percentage should equal floor((filesProcessed / totalFiles) * 100) with accuracy within 1%
**Validates: Requirements 4.5**

**Property 13: Progress bar width mapping**
*For any* progress percentage value P, the progress bar element width should be P% of its container width
**Validates: Requirements 5.1**

**Property 14: Visual state mapping**
*For any* scan, the progress bar CSS class should map correctly to the scan status (cancelled → 'cancelled-state', failed → 'error-state', etc.)
**Validates: Requirements 5.3, 5.4**

**Property 15: Independent progress tracking**
*For any* set of concurrent scans, each scan should maintain independent progress state without interference
**Validates: Requirements 5.5**

## Error Handling

### Cancellation Errors

1. **Cancellation during cleanup**: If cancellation occurs during repository cleanup, ensure cleanup completes before marking as cancelled
2. **Cancellation of already-completed scan**: Return error indicating scan is already complete
3. **Unauthorized cancellation**: Verify user owns the repository before allowing cancellation

### Progress Tracking Errors

1. **Database update failures**: Log error but continue scanning; retry progress update on next interval
2. **WebSocket broadcast failures**: Log error but don't fail the scan
3. **Redis connection failures**: Fall back to database-only cancellation checking (slower but functional)

### Edge Cases

1. **Scan with zero files**: Handle division by zero in progress calculation (show 100% immediately)
2. **Very fast scans**: Ensure at least one progress update is sent even if scan completes in <1 second
3. **Cancellation race conditions**: Handle case where scan completes naturally just as cancellation is requested

## Testing Strategy

### Unit Tests

Unit tests will cover specific examples and edge cases:

1. **Progress calculation edge cases**:
   - Zero files (0/0 = 100%)
   - Single file (1/1 = 100%)
   - Rounding behavior (33/100 = 33%)

2. **Status message formatting**:
   - Verify "Scanning files... 50 of 100" format
   - Verify "Cloning repository..." at start
   - Verify "Scan complete" at end

3. **Button visibility logic**:
   - Button visible for 'scanning' status
   - Button hidden for 'completed' status
   - Button hidden for 'pending' status

4. **Cancellation API integration**:
   - Verify correct endpoint called
   - Verify scan ID included in request
   - Verify authorization header included

### Property-Based Tests

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript/TypeScript PBT library):

**Configuration**: Each property test should run a minimum of 100 iterations.

**Test Tagging**: Each property-based test must include a comment tag in this format:
```typescript
// **Feature: scan-progress-control, Property {number}: {property_text}**
```

**Properties to test**:

1. **Property 1**: Progress percentage bounds - Generate random scan states and verify 0 ≤ progress ≤ 100
2. **Property 2**: Progress monotonicity - Generate sequences of progress updates and verify non-decreasing
3. **Property 3**: Progress update structure - Generate random progress updates and verify required fields present
4. **Property 4**: Stop button visibility - Generate random scan statuses and verify button visibility logic
5. **Property 6**: Cancellation stops processing - Generate random file lists and verify processing stops after cancel flag
6. **Property 7**: Cancellation updates status - Generate random scans and verify status becomes 'cancelled'
7. **Property 8**: Partial results persistence - Generate random issue lists and verify all saved on cancellation
8. **Property 9**: Status message format - Generate random file counts and verify message format
9. **Property 10**: Database update throttling - Generate rapid progress updates and verify throttling
10. **Property 11**: WebSocket update throttling - Generate rapid progress updates and verify throttling
11. **Property 12**: Progress calculation accuracy - Generate random file counts and verify calculation
12. **Property 13**: Progress bar width mapping - Generate random percentages and verify width calculation
13. **Property 14**: Visual state mapping - Generate random scan statuses and verify CSS class mapping
14. **Property 15**: Independent progress tracking - Generate multiple concurrent scans and verify independence

### Integration Tests

Integration tests will verify end-to-end workflows:

1. **Full scan with progress tracking**: Start scan, verify progress updates received, verify completion
2. **Scan cancellation flow**: Start scan, cancel mid-way, verify status and partial results
3. **WebSocket progress updates**: Connect WebSocket, start scan, verify real-time updates received
4. **Multiple concurrent scans**: Start multiple scans, verify independent progress tracking

### Performance Tests

1. **Progress update overhead**: Verify progress tracking adds <5% overhead to scan time
2. **WebSocket broadcast performance**: Verify system handles 100+ concurrent WebSocket connections
3. **Cancellation responsiveness**: Verify cancellation detected within 2 seconds

## Implementation Notes

### Scanner Modifications

The scanner will need to:
1. Accept callbacks for progress reporting and cancellation checking
2. Track progress state throughout the scan lifecycle
3. Implement throttling logic for database updates
4. Handle graceful shutdown on cancellation

### Backend Modifications

The backend will need to:
1. Add new database columns and migrations
2. Implement cancellation endpoint with authorization
3. Add Redis operations for cancellation flags
4. Enhance WebSocket broadcasts with progress events
5. Update scan worker to pass callbacks to scanner

### Frontend Modifications

The frontend will need to:
1. Create progress bar component with animations
2. Implement WebSocket listener for progress events
3. Add stop button with confirmation dialog
4. Update scan status display with real-time messages
5. Handle multiple concurrent scan displays

### Database Migration

```sql
-- Migration: Add progress tracking fields
ALTER TABLE scans 
  ADD COLUMN progress_percentage INTEGER DEFAULT 0,
  ADD COLUMN files_processed INTEGER DEFAULT 0,
  ADD COLUMN total_files_discovered INTEGER DEFAULT 0,
  ADD COLUMN current_status_message TEXT,
  ADD COLUMN cancelled_at TIMESTAMP;

-- Add index for active scans
CREATE INDEX idx_scans_status_active 
  ON scans(status) 
  WHERE status IN ('pending', 'scanning', 'analyzing');
```

### Redis Key Schema

```
scan:{scanId}:cancel          # Cancellation flag (expires in 1 hour)
scan:{scanId}:progress        # Cached progress state (expires in 1 hour)
```

## Dependencies

- **fast-check**: Property-based testing library for JavaScript/TypeScript
- **socket.io-client**: Frontend WebSocket client (already in use)
- **ioredis**: Redis client for Node.js (already in use)
- **bull**: Job queue library (already in use)

## Rollout Plan

1. **Phase 1**: Database schema changes and backend API
2. **Phase 2**: Scanner progress tracking implementation
3. **Phase 3**: WebSocket progress broadcasts
4. **Phase 4**: Frontend progress display
5. **Phase 5**: Cancellation functionality
6. **Phase 6**: Testing and optimization
