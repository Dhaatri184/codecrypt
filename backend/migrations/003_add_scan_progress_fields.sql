-- Migration: Add progress tracking and cancellation fields to scans table
-- This migration adds support for real-time progress tracking and scan cancellation

-- First, drop the existing CHECK constraint on status
ALTER TABLE scans DROP CONSTRAINT IF EXISTS scans_status_check;

-- Add the new CHECK constraint that includes 'cancelled'
ALTER TABLE scans 
  ADD CONSTRAINT scans_status_check 
  CHECK (status IN ('pending', 'scanning', 'analyzing', 'completed', 'failed', 'cancelled'));

-- Add progress tracking fields
ALTER TABLE scans 
  ADD COLUMN progress_percentage INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN files_processed INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN total_files_discovered INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN current_status_message TEXT,
  ADD COLUMN cancelled_at TIMESTAMP;

-- Add index for active scans to improve query performance
CREATE INDEX idx_scans_status_active 
  ON scans(status) 
  WHERE status IN ('pending', 'scanning', 'analyzing');

-- Add index for cancelled scans
CREATE INDEX idx_scans_cancelled 
  ON scans(cancelled_at) 
  WHERE cancelled_at IS NOT NULL;

-- Add comment to document the new fields
COMMENT ON COLUMN scans.progress_percentage IS 'Current scan progress as percentage (0-100)';
COMMENT ON COLUMN scans.files_processed IS 'Number of files processed so far';
COMMENT ON COLUMN scans.total_files_discovered IS 'Total number of files discovered for scanning';
COMMENT ON COLUMN scans.current_status_message IS 'Human-readable status message for UI display';
COMMENT ON COLUMN scans.cancelled_at IS 'Timestamp when scan was cancelled by user';
