-- CodeCrypt Database Schema
-- Initial migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_id VARCHAR(255) UNIQUE NOT NULL,
  github_username VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_github_username ON users(github_username);

-- Repositories table
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  github_repo_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(512) NOT NULL,
  clone_url TEXT NOT NULL,
  default_branch VARCHAR(255) DEFAULT 'main',
  last_scan_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, github_repo_id)
);

CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_github_repo_id ON repositories(github_repo_id);
CREATE INDEX idx_repositories_last_scan_at ON repositories(last_scan_at);

-- Scans table
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'scanning', 'analyzing', 'completed', 'failed')),
  commit_sha VARCHAR(40),
  total_files INTEGER,
  total_issues INTEGER,
  haunting_level VARCHAR(50),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

CREATE INDEX idx_scans_repository_id ON scans(repository_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_started_at ON scans(started_at DESC);

-- Issues table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  haunting_type VARCHAR(50) NOT NULL CHECK (haunting_type IN ('ghost', 'zombie', 'vampire', 'skeleton', 'monster')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  file_path TEXT NOT NULL,
  start_line INTEGER NOT NULL CHECK (start_line > 0),
  end_line INTEGER NOT NULL CHECK (end_line > 0),
  code_snippet TEXT,
  rule_id VARCHAR(255),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_line_numbers CHECK (end_line >= start_line)
);

CREATE INDEX idx_issues_scan_id ON issues(scan_id);
CREATE INDEX idx_issues_haunting_type ON issues(haunting_type);
CREATE INDEX idx_issues_severity ON issues(severity);
CREATE INDEX idx_issues_file_path ON issues(file_path);

-- AI Explanations table
CREATE TABLE ai_explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  explanation TEXT NOT NULL,
  fix_suggestion TEXT,
  code_example TEXT,
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_explanations_issue_id ON ai_explanations(issue_id);

-- Exorcisms table
CREATE TABLE exorcisms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  branch_name VARCHAR(255),
  pr_url TEXT,
  pr_number INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_exorcisms_issue_id ON exorcisms(issue_id);
CREATE INDEX idx_exorcisms_status ON exorcisms(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user authentication and profile information';
COMMENT ON TABLE repositories IS 'Stores connected GitHub repositories';
COMMENT ON TABLE scans IS 'Stores scan execution records and results';
COMMENT ON TABLE issues IS 'Stores detected code quality issues';
COMMENT ON TABLE ai_explanations IS 'Stores AI-generated explanations for issues';
COMMENT ON TABLE exorcisms IS 'Stores auto-fix attempts and pull request information';
