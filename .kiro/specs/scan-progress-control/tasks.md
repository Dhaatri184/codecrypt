# Implementation Plan

- [x] 1. Database schema and shared types



  - Add progress tracking fields to scans table
  - Update ScanStatus type to include 'cancelled'
  - Update Scan interface with new fields
  - Create database migration file
  - _Requirements: 1.1, 1.5, 2.4_






- [ ] 2. Backend progress tracking infrastructure
- [ ] 2.1 Create progress update repository functions
  - Implement updateScanProgress() function
  - Implement getScanProgress() function
  - Add throttling logic to batch database writes
  - _Requirements: 1.2, 4.1, 4.2_

- [ ] 2.2 Write property test for progress update throttling
  - **Property 10: Database update throttling**
  - **Validates: Requirements 4.1, 4.2**

- [x] 2.3 Write property test for progress calculation accuracy


  - **Property 12: Progress calculation accuracy**
  - **Validates: Requirements 4.5**

- [ ] 3. Redis cancellation flag system
- [ ] 3.1 Implement Redis cancellation operations
  - Create setCancellationFlag() function
  - Create checkCancellationFlag() function
  - Add Redis key expiration (1 hour TTL)
  - _Requirements: 2.3, 4.4_

- [x] 3.2 Write unit tests for Redis cancellation operations


  - Test flag setting and retrieval
  - Test flag expiration
  - Test Redis connection failure fallback
  - _Requirements: 2.3_

- [ ] 4. Backend cancellation API endpoint
- [ ] 4.1 Create POST /api/scans/:id/cancel endpoint
  - Verify user authorization
  - Set cancellation flag in Redis
  - Update scan status to 'cancelled'
  - Return success response
  - _Requirements: 2.2, 2.4_

- [ ] 4.2 Write property test for cancellation authorization
  - **Property 7: Cancellation updates status**
  - **Validates: Requirements 2.4**



- [ ] 4.3 Write unit tests for cancellation endpoint
  - Test unauthorized access rejection
  - Test already-completed scan handling

  - Test successful cancellation
  - _Requirements: 2.2, 2.4_

- [ ] 5. Enhanced WebSocket events
- [ ] 5.1 Add scan_progress WebSocket event
  - Create broadcastScanProgress() function
  - Include progress percentage, file counts, status message
  - Add throttling to limit broadcasts to 2 per second
  - _Requirements: 1.2, 1.5, 4.3_



- [ ] 5.2 Add scan_cancelled WebSocket event
  - Create broadcastScanCancelled() function
  - Include partial results in payload
  - _Requirements: 2.4, 2.5_


- [ ] 5.3 Write property test for WebSocket throttling
  - **Property 11: WebSocket update throttling**
  - **Validates: Requirements 4.3**

- [ ] 6. Scanner progress tracking implementation
- [ ] 6.1 Add progress tracking to Scanner class
  - Add ProgressUpdate interface
  - Add ScannerCallbacks interface
  - Track filesProcessed and totalFiles
  - Calculate progress percentage
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 6.2 Implement progress reporting in scan loop
  - Report progress every 1 second or every 10 files
  - Update status messages for each phase
  - Call onProgress callback with throttling
  - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1_


- [ ] 6.3 Write property test for progress bounds
  - **Property 1: Progress percentage bounds**
  - **Validates: Requirements 1.1, 1.3, 1.4**

- [ ] 6.4 Write property test for progress monotonicity
  - **Property 2: Progress monotonicity**
  - **Validates: Requirements 1.2**

- [ ] 6.5 Write property test for progress update structure
  - **Property 3: Progress update structure**
  - **Validates: Requirements 1.5**

- [ ] 7. Scanner cancellation handling
- [ ] 7.1 Add cancellation checking to Scanner
  - Check shouldCancel callback between batches
  - Stop processing when cancellation detected
  - Clean up resources on cancellation
  - Save partial results
  - _Requirements: 2.3, 2.5, 4.4_



- [ ] 7.2 Write property test for cancellation stops processing
  - **Property 6: Cancellation stops processing**
  - **Validates: Requirements 2.3, 4.4**

- [ ] 7.3 Write property test for partial results persistence
  - **Property 8: Partial results persistence**
  - **Validates: Requirements 2.5**

- [ ] 7.4 Write unit tests for cancellation edge cases
  - Test cancellation during cleanup
  - Test cancellation with zero files
  - Test cancellation race conditions
  - _Requirements: 2.3, 2.5_



- [ ] 8. Update scan worker to use progress callbacks
- [ ] 8.1 Modify scanWorker to pass callbacks to scanner
  - Implement onProgress callback that updates DB and broadcasts
  - Implement shouldCancel callback that checks Redis
  - Handle cancellation gracefully
  - Broadcast cancellation event
  - _Requirements: 1.2, 2.3, 2.4, 2.5_

- [ ] 8.2 Write property test for status message format
  - **Property 9: Status message format during scanning**
  - **Validates: Requirements 3.3**

- [ ] 9. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Frontend progress bar component
- [ ] 10.1 Create ScanProgress component
  - Accept scanId, status, progress, file counts as props
  - Render progress bar with percentage width
  - Display file count (X of Y files)

  - Display status message
  - Add CSS for different states (scanning, cancelled, failed, completed)
  - _Requirements: 1.1, 1.5, 5.1, 5.3, 5.4_

- [ ] 10.2 Write property test for progress bar width mapping
  - **Property 13: Progress bar width mapping**
  - **Validates: Requirements 5.1**

- [ ] 10.3 Write property test for visual state mapping
  - **Property 14: Visual state mapping**
  - **Validates: Requirements 5.3, 5.4**

- [ ] 10.4 Write unit tests for ScanProgress component
  - Test rendering with different progress values
  - Test rendering with different statuses
  - Test file count display
  - _Requirements: 1.1, 1.5, 5.1_

- [ ] 11. Frontend stop button functionality
- [ ] 11.1 Add stop button to ScanProgress component
  - Show button only when status is 'scanning' or 'analyzing'

  - Add onClick handler to call onCancel prop
  - Add confirmation dialog before cancelling
  - Disable button after click to prevent double-cancel
  - _Requirements: 2.1, 2.2, 2.6_

- [ ] 11.2 Write property test for stop button visibility
  - **Property 4: Stop button visibility**
  - **Validates: Requirements 2.1, 2.6**

- [ ] 11.3 Write property test for cancellation triggers API call
  - **Property 5: Cancellation triggers API call**
  - **Validates: Requirements 2.2**

- [x] 11.4 Write unit tests for stop button


  - Test button visibility logic
  - Test onClick handler called
  - Test confirmation dialog
  - _Requirements: 2.1, 2.2, 2.6_

- [ ] 12. Frontend WebSocket progress listener
- [ ] 12.1 Add WebSocket event listeners for progress
  - Listen for 'scan_progress' events
  - Listen for 'scan_cancelled' events
  - Update component state on events
  - Handle reconnection gracefully


  - _Requirements: 1.2, 2.4_

- [ ] 12.2 Write unit tests for WebSocket listeners
  - Test progress event handling
  - Test cancellation event handling
  - Test reconnection handling
  - _Requirements: 1.2, 2.4_

- [ ] 13. Frontend API client for cancellation
- [ ] 13.1 Add cancelScan API function
  - Implement POST /api/scans/:id/cancel
  - Include authorization header
  - Handle error responses
  - Return success/error status
  - _Requirements: 2.2_

- [ ] 13.2 Write unit tests for cancelScan API function
  - Test successful cancellation
  - Test error handling
  - Test authorization header included
  - _Requirements: 2.2_

- [ ] 14. Integrate progress display into scan views
- [ ] 14.1 Update repository detail page
  - Add ScanProgress component to active scan display
  - Wire up onCancel handler to call cancelScan API
  - Update scan list to show progress for each scan
  - Handle multiple concurrent scans
  - _Requirements: 1.1, 2.1, 2.2, 5.5_

- [ ] 14.2 Write property test for independent progress tracking
  - **Property 15: Independent progress tracking**
  - **Validates: Requirements 5.5**

- [ ] 14.3 Write integration tests for scan progress flow
  - Test full scan with progress updates
  - Test scan cancellation flow
  - Test multiple concurrent scans
  - _Requirements: 1.1, 1.2, 2.2, 2.3, 2.4_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
