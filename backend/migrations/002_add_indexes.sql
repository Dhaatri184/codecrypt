-- Add indexes for performance optimization

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- Repositories table indexes
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_last_scan_at ON repositories(last_scan_at DESC);

-- Scans table indexes
CREATE INDEX IF NOT EXISTS idx_scans_repository_id ON scans(repository_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_started_at ON scans(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_repository_started ON scans(repository_id, started_at DESC);

-- Issues table indexes
CREATE INDEX IF NOT EXISTS idx_issues_scan_id ON issues(scan_id);
CREATE INDEX IF NOT EXISTS idx_issues_haunting_type ON issues(haunting_type);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_scan_type ON issues(scan_id, haunting_type);

-- AI Explanations table indexes
CREATE INDEX IF NOT EXISTS idx_ai_explanations_issue_id ON ai_explanations(issue_id);

-- Exorcisms table indexes
CREATE INDEX IF NOT EXISTS idx_exorcisms_issue_id ON exorcisms(issue_id);
CREATE INDEX IF NOT EXISTS idx_exorcisms_status ON exorcisms(status);
CREATE INDEX IF NOT EXISTS idx_exorcisms_created_at ON exorcisms(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scans_repo_status_date ON scans(repository_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_scan_severity ON issues(scan_id, severity);
