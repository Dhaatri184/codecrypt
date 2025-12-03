-- Development seed data for CodeCrypt

-- Insert a test user
INSERT INTO users (id, github_id, github_username, access_token)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test_github_id', 'testuser', 'test_access_token')
ON CONFLICT (github_id) DO NOTHING;

-- Insert a test repository
INSERT INTO repositories (id, user_id, github_repo_id, name, full_name, clone_url, default_branch)
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'test_repo_id',
    'test-repo',
    'testuser/test-repo',
    'https://github.com/testuser/test-repo.git',
    'main'
  )
ON CONFLICT (user_id, github_repo_id) DO NOTHING;

-- Insert a test scan
INSERT INTO scans (id, repository_id, status, commit_sha, total_files, total_issues, haunting_level, completed_at)
VALUES 
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'completed',
    'abc123def456',
    10,
    5,
    'Mildly Cursed',
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Insert test issues
INSERT INTO issues (scan_id, haunting_type, severity, file_path, start_line, end_line, code_snippet, rule_id, message)
VALUES 
  (
    '00000000-0000-0000-0000-000000000003',
    'ghost',
    'medium',
    'src/utils/helper.ts',
    10,
    15,
    'const unusedVariable = "test";',
    'no-unused-vars',
    'Variable "unusedVariable" is defined but never used'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'monster',
    'high',
    'src/services/complex.ts',
    50,
    120,
    'function complexFunction() { /* ... */ }',
    'complexity',
    'Function has a cyclomatic complexity of 25'
  )
ON CONFLICT DO NOTHING;
