-- Feature Enhancements Migration
-- Adds tables for dismissals, notes, schedules, and quality thresholds

-- Issue Dismissals table
CREATE TABLE issue_dismissals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  dismissed_by VARCHAR(255) NOT NULL,
  dismissed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('false_positive', 'wont_fix', 'accepted_risk', 'planned', 'other')),
  notes TEXT,
  issue_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(issue_id)
);

CREATE INDEX idx_issue_dismissals_issue_id ON issue_dismissals(issue_id);
CREATE INDEX idx_issue_dismissals_issue_hash ON issue_dismissals(issue_hash);
CREATE INDEX idx_issue_dismissals_dismissed_at ON issue_dismissals(dismissed_at DESC);

COMMENT ON TABLE issue_dismissals IS 'Stores dismissed issues with reasons and change detection';
COMMENT ON COLUMN issue_dismissals.issue_hash IS 'Hash of issue content for detecting changes';
COMMENT ON COLUMN issue_dismissals.reason IS 'Reason for dismissal: false_positive, wont_fix, accepted_risk, planned, other';

-- Issue Notes table
CREATE TABLE issue_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_issue_notes_issue_id ON issue_notes(issue_id);
CREATE INDEX idx_issue_notes_created_at ON issue_notes(created_at DESC);
CREATE INDEX idx_issue_notes_author ON issue_notes(author);

-- Trigger for issue_notes updated_at
CREATE TRIGGER update_issue_notes_updated_at BEFORE UPDATE ON issue_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE issue_notes IS 'Stores user notes and comments on issues';
COMMENT ON COLUMN issue_notes.content IS 'Note content with markdown support';

-- Scan Schedules table
CREATE TABLE scan_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'on_push')),
  schedule_config JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(repository_id)
);

CREATE INDEX idx_scan_schedules_repository_id ON scan_schedules(repository_id);
CREATE INDEX idx_scan_schedules_enabled ON scan_schedules(enabled);
CREATE INDEX idx_scan_schedules_next_run_at ON scan_schedules(next_run_at);
CREATE INDEX idx_scan_schedules_schedule_type ON scan_schedules(schedule_type);

-- Trigger for scan_schedules updated_at
CREATE TRIGGER update_scan_schedules_updated_at BEFORE UPDATE ON scan_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE scan_schedules IS 'Stores automated scan schedules for repositories';
COMMENT ON COLUMN scan_schedules.schedule_type IS 'Type of schedule: daily, weekly, or on_push';
COMMENT ON COLUMN scan_schedules.schedule_config IS 'JSON configuration for schedule (hour, minute, dayOfWeek, branch, etc.)';

-- Quality Thresholds table
CREATE TABLE quality_thresholds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  haunting_type VARCHAR(20) NOT NULL CHECK (haunting_type IN ('ghost', 'zombie', 'vampire', 'skeleton', 'monster')),
  max_count INTEGER NOT NULL CHECK (max_count >= 0),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(repository_id, haunting_type, severity)
);

CREATE INDEX idx_quality_thresholds_repository_id ON quality_thresholds(repository_id);
CREATE INDEX idx_quality_thresholds_haunting_type ON quality_thresholds(haunting_type);

-- Trigger for quality_thresholds updated_at
CREATE TRIGGER update_quality_thresholds_updated_at BEFORE UPDATE ON quality_thresholds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE quality_thresholds IS 'Stores quality gate thresholds for repositories';
COMMENT ON COLUMN quality_thresholds.max_count IS 'Maximum allowed count for this haunting type/severity';
COMMENT ON COLUMN quality_thresholds.severity IS 'Optional: threshold for specific severity level';

-- Add quality score and threshold status to scans table
ALTER TABLE scans ADD COLUMN quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100);
ALTER TABLE scans ADD COLUMN threshold_status VARCHAR(20) CHECK (threshold_status IN ('passing', 'failing'));

CREATE INDEX idx_scans_quality_score ON scans(quality_score);
CREATE INDEX idx_scans_threshold_status ON scans(threshold_status);

COMMENT ON COLUMN scans.quality_score IS 'Calculated quality score from 0-100';
COMMENT ON COLUMN scans.threshold_status IS 'Quality gate status: passing or failing';

-- Add issue_hash column to issues table for change detection
ALTER TABLE issues ADD COLUMN issue_hash VARCHAR(64);

CREATE INDEX idx_issues_issue_hash ON issues(issue_hash);

COMMENT ON COLUMN issues.issue_hash IS 'Hash of issue content for tracking changes across scans';

