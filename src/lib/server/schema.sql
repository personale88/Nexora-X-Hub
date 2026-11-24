-- ==============================================================================
-- RepoPilot AI — Production PostgreSQL Schema & Migration
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. OAuth Accounts Table (Encrypted at Rest with AES-256-GCM)
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL, -- 'google' | 'github'
    provider_account_id VARCHAR(255) NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    expires_at BIGINT,
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_account_id)
);

-- 3. Sessions Table (Hardened HttpOnly cookie sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Connected GitHub Accounts (Repository Access & Least Privilege)
CREATE TABLE IF NOT EXISTS connected_github_accounts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    github_username VARCHAR(255) NOT NULL,
    github_id VARCHAR(64) NOT NULL,
    avatar_url TEXT,
    scope TEXT,
    connected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Repair Jobs Table
CREATE TABLE IF NOT EXISTS repair_jobs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_owner VARCHAR(255) NOT NULL,
    repository_name VARCHAR(255) NOT NULL,
    repository_branch VARCHAR(255) NOT NULL,
    repository_git_url TEXT NOT NULL,
    pinned_commit_sha VARCHAR(64) NOT NULL,
    local_path TEXT,
    issue_code VARCHAR(64),
    issue_description TEXT NOT NULL,
    reproduction_evidence TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED', -- QUEUED, INITIALIZING, REPRODUCING, INVESTIGATING, DIAGNOSING, PATCHING, TESTING, VERIFYING, COMPLETED, FAILED, CANCELLED, NEEDS_REVIEW
    current_stage TEXT NOT NULL,
    diagnosis JSONB,
    proposed_patch JSONB,
    test_runs JSONB DEFAULT '[]'::jsonb,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    verification_outcome VARCHAR(32) DEFAULT 'INCOMPLETE',
    unresolved_risks JSONB DEFAULT '[]'::jsonb,
    pull_request JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 6. Repair Job Real-Time Events Table (SSE Audit Trail)
CREATE TABLE IF NOT EXISTS repair_events (
    event_id VARCHAR(64) PRIMARY KEY,
    job_id VARCHAR(64) NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,
    sequence INT NOT NULL,
    type VARCHAR(64) NOT NULL,
    stage VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Performance & Retrieval Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_user_id ON repair_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_status ON repair_jobs(status);
CREATE INDEX IF NOT EXISTS idx_repair_events_job_id ON repair_events(job_id, sequence);
