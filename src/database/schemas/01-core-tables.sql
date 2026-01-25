-- ============================================================================
-- DBSmart AI Ticket Analysis System - Core Tables Schema
-- ============================================================================
-- Description: Creates the core tables for storing AI analyses, review queue,
--              metrics, and feedback
-- Version: 1.0
-- Date: 2026-01-23
-- ============================================================================

-- Create database (run separately if needed)
-- CREATE DATABASE DBSmartAI;
-- GO

USE DBSmartAI;
GO

-- ============================================================================
-- Table: ai_analyses
-- Description: Stores all AI-generated ticket analyses
-- ============================================================================
CREATE TABLE ai_analyses (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ticket_id NVARCHAR(50) NOT NULL,                    -- Zendesk ticket ID (e.g., "ZD-12345")
    analysis_timestamp DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    confidence_level NVARCHAR(20) NOT NULL              -- 'High', 'Medium', 'Low'
        CHECK (confidence_level IN ('High', 'Medium', 'Low')),
    confidence_score DECIMAL(5,2) NULL,                 -- Numeric score 0-100

    -- Symptom Analysis
    issue_type NVARCHAR(50) NULL,                       -- 'Performance', 'Availability', 'Deadlock', etc.
    affected_components NVARCHAR(MAX) NULL,             -- JSON array of components
    severity_assessment NVARCHAR(20) NULL               -- 'Critical', 'High', 'Medium', 'Low'
        CHECK (severity_assessment IN ('Critical', 'High', 'Medium', 'Low')),
    executive_summary NVARCHAR(MAX) NULL,

    -- Full Analysis (JSON)
    symptom_analysis_json NVARCHAR(MAX) NULL,           -- Full symptom analysis details
    data_correlations_json NVARCHAR(MAX) NULL,          -- SQL Sentry correlations
    root_cause_analysis_json NVARCHAR(MAX) NULL,        -- RCA details
    immediate_remediation_json NVARCHAR(MAX) NULL,      -- Remediation steps
    prevention_recommendations_json NVARCHAR(MAX) NULL, -- Prevention strategies
    similar_tickets_json NVARCHAR(MAX) NULL,            -- Similar tickets from GraphRAG
    queries_for_investigation NVARCHAR(MAX) NULL,       -- SQL queries to run

    -- Full JSON Response (for debugging/audit)
    full_analysis_json NVARCHAR(MAX) NULL,

    -- Processing Metadata
    processing_time_ms INT NULL,                        -- Time taken to generate analysis
    graphrag_query_time_ms INT NULL,                    -- Time for GraphRAG queries
    sql_sentry_query_time_ms INT NULL,                  -- Time for SQL Sentry queries
    openai_api_time_ms INT NULL,                        -- Time for OpenAI API call

    -- Token Usage (for cost tracking)
    input_tokens INT NULL,
    output_tokens INT NULL,
    total_tokens INT NULL,

    -- Status & Timestamps
    status NVARCHAR(20) NOT NULL DEFAULT 'pending'      -- 'pending', 'approved', 'rejected', 'posted'
        CHECK (status IN ('pending', 'approved', 'rejected', 'posted', 'failed')),
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    posted_to_zendesk_at DATETIME2(7) NULL,

    -- Customer Context (denormalized for querying)
    customer_id NVARCHAR(100) NULL,
    customer_name NVARCHAR(255) NULL,
    server_names NVARCHAR(MAX) NULL,                    -- Comma-separated
    database_names NVARCHAR(MAX) NULL,                  -- Comma-separated

    -- Version (for schema evolution)
    schema_version INT NOT NULL DEFAULT 1
);
GO

-- ============================================================================
-- Table: review_queue
-- Description: Tracks approval workflow and DBChief edits
-- ============================================================================
CREATE TABLE review_queue (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    analysis_id BIGINT NOT NULL,
    ticket_id NVARCHAR(50) NOT NULL,

    -- Queue Status
    queue_status NVARCHAR(20) NOT NULL DEFAULT 'pending' -- 'pending', 'in_review', 'approved', 'rejected'
        CHECK (queue_status IN ('pending', 'in_review', 'approved', 'rejected')),
    priority INT NOT NULL DEFAULT 3,                     -- 1=Critical, 2=High, 3=Medium, 4=Low

    -- Review Information
    assigned_to NVARCHAR(255) NULL,                      -- DBChief email or ID
    reviewed_by NVARCHAR(255) NULL,
    reviewed_at DATETIME2(7) NULL,

    -- Edits Made by DBChief
    was_edited BIT NOT NULL DEFAULT 0,
    edited_content NVARCHAR(MAX) NULL,                   -- Modified analysis text
    edit_notes NVARCHAR(MAX) NULL,                       -- DBChief's notes on changes

    -- Approval/Rejection
    approval_action NVARCHAR(20) NULL                    -- 'approve', 'approve_notify', 'reject', 'revise'
        CHECK (approval_action IN ('approve', 'approve_notify', 'reject', 'revise')),
    rejection_reason NVARCHAR(MAX) NULL,

    -- Feedback
    quality_rating INT NULL CHECK (quality_rating BETWEEN 1 AND 5),
    relevance_rating INT NULL CHECK (relevance_rating BETWEEN 1 AND 5),
    feedback_comment NVARCHAR(MAX) NULL,

    -- SLA Tracking
    entered_queue_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    sla_deadline DATETIME2(7) NULL,                      -- Calculated: entered + 24 hours
    is_overdue AS CASE
        WHEN queue_status IN ('pending', 'in_review') AND GETUTCDATE() > sla_deadline
        THEN 1 ELSE 0
    END,

    -- Timestamps
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),

    -- Foreign Key
    CONSTRAINT FK_review_queue_analysis FOREIGN KEY (analysis_id)
        REFERENCES ai_analyses(id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- Table: analysis_metrics
-- Description: Stores performance and quality metrics for analyses
-- ============================================================================
CREATE TABLE analysis_metrics (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    metric_date DATE NOT NULL,                           -- Aggregation date
    metric_hour INT NULL,                                -- Hour of day (0-23) for hourly metrics

    -- Volume Metrics
    total_analyses INT NOT NULL DEFAULT 0,
    analyses_high_confidence INT NOT NULL DEFAULT 0,
    analyses_medium_confidence INT NOT NULL DEFAULT 0,
    analyses_low_confidence INT NOT NULL DEFAULT 0,

    -- Quality Metrics
    analyses_approved INT NOT NULL DEFAULT 0,
    analyses_rejected INT NOT NULL DEFAULT 0,
    analyses_edited INT NOT NULL DEFAULT 0,
    average_quality_rating DECIMAL(3,2) NULL,

    -- Performance Metrics
    average_processing_time_ms INT NULL,
    average_graphrag_time_ms INT NULL,
    average_sql_sentry_time_ms INT NULL,
    average_openai_time_ms INT NULL,

    -- Token Usage & Cost
    total_input_tokens BIGINT NOT NULL DEFAULT 0,
    total_output_tokens BIGINT NOT NULL DEFAULT 0,
    estimated_cost_usd DECIMAL(10,4) NULL,               -- Based on token usage

    -- Issue Type Breakdown (JSON)
    issue_type_distribution NVARCHAR(MAX) NULL,          -- {"Performance": 45, "Deadlock": 30, ...}

    -- Timestamps
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),

    -- Unique constraint on date/hour
    CONSTRAINT UQ_metrics_date_hour UNIQUE (metric_date, metric_hour)
);
GO

-- ============================================================================
-- Table: feedback_log
-- Description: Detailed feedback from DBChief on analysis quality
-- ============================================================================
CREATE TABLE feedback_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    analysis_id BIGINT NOT NULL,
    ticket_id NVARCHAR(50) NOT NULL,

    -- Feedback Details
    feedback_type NVARCHAR(50) NOT NULL                 -- 'approval', 'rejection', 'edit', 'rating'
        CHECK (feedback_type IN ('approval', 'rejection', 'edit', 'rating', 'comment')),

    -- Ratings (1-5 scale)
    overall_quality INT NULL CHECK (overall_quality BETWEEN 1 AND 5),
    accuracy_rating INT NULL CHECK (accuracy_rating BETWEEN 1 AND 5),
    completeness_rating INT NULL CHECK (completeness_rating BETWEEN 1 AND 5),
    relevance_rating INT NULL CHECK (relevance_rating BETWEEN 1 AND 5),
    actionability_rating INT NULL CHECK (actionability_rating BETWEEN 1 AND 5),

    -- Similar Tickets Quality
    similar_tickets_helpful BIT NULL,                    -- Were similar tickets useful?
    similar_tickets_relevance INT NULL CHECK (similar_tickets_relevance BETWEEN 1 AND 5),

    -- RCA Quality
    rca_accurate BIT NULL,
    rca_depth INT NULL CHECK (rca_depth BETWEEN 1 AND 5),

    -- Remediation Quality
    remediation_actionable BIT NULL,
    remediation_safety INT NULL CHECK (remediation_safety BETWEEN 1 AND 5),

    -- Free-form Feedback
    comment NVARCHAR(MAX) NULL,
    improvement_suggestions NVARCHAR(MAX) NULL,

    -- Metadata
    submitted_by NVARCHAR(255) NOT NULL,                 -- DBChief email
    submitted_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),

    -- Foreign Key
    CONSTRAINT FK_feedback_analysis FOREIGN KEY (analysis_id)
        REFERENCES ai_analyses(id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- Table: system_config
-- Description: Stores system configuration settings (GraphRAG, AI, schedules)
-- ============================================================================
CREATE TABLE system_config (
    id INT IDENTITY(1,1) PRIMARY KEY,
    config_key NVARCHAR(100) NOT NULL UNIQUE,
    config_value NVARCHAR(MAX) NULL,
    data_type NVARCHAR(20) NOT NULL DEFAULT 'string'     -- 'string', 'int', 'decimal', 'bool', 'json'
        CHECK (data_type IN ('string', 'int', 'decimal', 'bool', 'json')),
    category NVARCHAR(50) NOT NULL,                      -- 'graphrag', 'ai_analysis', 'pipeline', 'alerts'
    description NVARCHAR(MAX) NULL,
    is_sensitive BIT NOT NULL DEFAULT 0,                 -- If true, value is encrypted

    -- Audit
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_by NVARCHAR(255) NULL
);
GO

-- Insert default configuration
INSERT INTO system_config (config_key, config_value, data_type, category, description) VALUES
('graphrag.similarity_threshold', '0.85', 'decimal', 'graphrag', 'Cosine similarity threshold for SIMILAR_TO relationships'),
('graphrag.search_scope_months', '12', 'int', 'graphrag', 'Limit semantic search to last X months'),
('graphrag.max_similar_tickets', '5', 'int', 'graphrag', 'Maximum number of similar tickets to return'),
('graphrag.min_relevance_score', '0.70', 'decimal', 'graphrag', 'Minimum relevance score for similar tickets'),

('ai_analysis.confidence_data_weight', '40', 'int', 'ai_analysis', 'Weight for data completeness in confidence score (%)'),
('ai_analysis.confidence_correlation_weight', '30', 'int', 'ai_analysis', 'Weight for correlation strength in confidence score (%)'),
('ai_analysis.confidence_similarity_weight', '30', 'int', 'ai_analysis', 'Weight for similar ticket availability in confidence score (%)'),
('ai_analysis.sql_sentry_time_window_hours', '2', 'int', 'ai_analysis', 'Time window for SQL Sentry correlation (± hours)'),
('ai_analysis.max_concurrent_analyses', '10', 'int', 'ai_analysis', 'Maximum concurrent ticket analyses'),

('openai.model', 'gpt-4o', 'string', 'ai_analysis', 'OpenAI model to use for analysis'),
('openai.temperature', '0.3', 'decimal', 'ai_analysis', 'Temperature for OpenAI API calls'),
('openai.max_tokens', '2000', 'int', 'ai_analysis', 'Maximum output tokens'),

('pipeline.indexing_schedule', '0 0 * * *', 'string', 'pipeline', 'Cron expression for GraphRAG indexing'),
('pipeline.analysis_schedule', '0 1 * * *', 'string', 'pipeline', 'Cron expression for AI analysis'),
('pipeline.auto_processing_enabled', 'true', 'bool', 'pipeline', 'Enable/disable automatic processing'),

('alerts.high_error_rate_threshold', '10', 'int', 'alerts', 'High error rate threshold (% in 1 hour)'),
('alerts.low_approval_rate_threshold', '50', 'int', 'alerts', 'Low approval rate threshold (%)'),
('alerts.cost_budget_monthly_usd', '2000', 'decimal', 'alerts', 'Monthly cost budget for alerts');
GO

-- ============================================================================
-- Table: audit_log
-- Description: Comprehensive audit trail for all administrative actions
-- ============================================================================
CREATE TABLE audit_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,

    -- Event Details
    event_type NVARCHAR(50) NOT NULL,                    -- 'config_change', 'manual_trigger', 'data_modification', 'user_action'
    entity_type NVARCHAR(50) NULL,                       -- 'config', 'analysis', 'entity', 'graphrag_index'
    entity_id NVARCHAR(100) NULL,                        -- ID of affected entity
    action NVARCHAR(50) NOT NULL,                        -- 'create', 'update', 'delete', 'approve', 'reject', 'trigger'

    -- Change Details
    old_value NVARCHAR(MAX) NULL,                        -- Previous value (JSON)
    new_value NVARCHAR(MAX) NULL,                        -- New value (JSON)
    change_description NVARCHAR(MAX) NULL,

    -- User Information
    user_id NVARCHAR(255) NOT NULL,                      -- Azure AD user ID or email
    user_name NVARCHAR(255) NULL,
    user_role NVARCHAR(50) NULL,                         -- 'SystemAdministrator', 'DBChief', 'DBNinja'
    ip_address NVARCHAR(45) NULL,                        -- IPv4 or IPv6

    -- Request Context
    request_id NVARCHAR(100) NULL,                       -- Correlation ID for tracking
    session_id NVARCHAR(100) NULL,

    -- Timestamp
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================================
-- Table: job_history
-- Description: Tracks execution history of batch jobs (indexing, analysis)
-- ============================================================================
CREATE TABLE job_history (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,

    -- Job Details
    job_type NVARCHAR(50) NOT NULL,                      -- 'graphrag_indexing', 'ai_analysis', 'similarity_update'
    job_id NVARCHAR(100) NOT NULL,                       -- Unique ID for this job run
    trigger_type NVARCHAR(50) NOT NULL,                  -- 'scheduled', 'manual', 'api'

    -- Status
    status NVARCHAR(20) NOT NULL DEFAULT 'running'       -- 'running', 'completed', 'failed', 'partial'
        CHECK (status IN ('running', 'completed', 'failed', 'partial', 'cancelled')),

    -- Metrics
    items_processed INT NOT NULL DEFAULT 0,              -- Tickets processed
    items_succeeded INT NOT NULL DEFAULT 0,
    items_failed INT NOT NULL DEFAULT 0,

    -- Timing
    started_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    completed_at DATETIME2(7) NULL,
    duration_seconds AS DATEDIFF(SECOND, started_at, completed_at),

    -- Error Information
    error_message NVARCHAR(MAX) NULL,
    error_details NVARCHAR(MAX) NULL,                    -- Stack trace, JSON error details

    -- Job Configuration (snapshot at execution time)
    job_config_snapshot NVARCHAR(MAX) NULL,              -- JSON snapshot of config

    -- Triggered By
    triggered_by NVARCHAR(255) NULL,                     -- User who triggered (for manual jobs)

    -- Logs Reference
    log_file_path NVARCHAR(500) NULL                     -- Path to detailed logs if stored separately
);
GO

-- ============================================================================
-- Table: graphrag_sync_status
-- Description: Tracks GraphRAG indexing synchronization status
-- ============================================================================
CREATE TABLE graphrag_sync_status (
    id INT IDENTITY(1,1) PRIMARY KEY,

    -- Sync Details
    sync_type NVARCHAR(50) NOT NULL,                     -- 'full', 'incremental', 'backfill'
    status NVARCHAR(20) NOT NULL DEFAULT 'in_progress'   -- 'in_progress', 'completed', 'failed'
        CHECK (status IN ('in_progress', 'completed', 'failed')),

    -- Zendesk Sync Details
    zendesk_tickets_fetched INT NOT NULL DEFAULT 0,
    zendesk_tickets_new INT NOT NULL DEFAULT 0,
    zendesk_tickets_updated INT NOT NULL DEFAULT 0,
    zendesk_last_sync_date DATETIME2(7) NULL,

    -- GraphRAG Indexing Details
    tickets_indexed INT NOT NULL DEFAULT 0,
    embeddings_generated INT NOT NULL DEFAULT 0,
    relationships_created INT NOT NULL DEFAULT 0,
    entities_extracted INT NOT NULL DEFAULT 0,

    -- Performance
    fetch_time_ms INT NULL,
    indexing_time_ms INT NULL,
    total_time_ms INT NULL,

    -- Errors
    errors_count INT NOT NULL DEFAULT 0,
    error_details NVARCHAR(MAX) NULL,                    -- JSON array of errors

    -- Timestamps
    started_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    completed_at DATETIME2(7) NULL,

    -- Foreign Key to job_history
    job_history_id BIGINT NULL,
    CONSTRAINT FK_graphrag_sync_job FOREIGN KEY (job_history_id)
        REFERENCES job_history(id) ON DELETE SET NULL
);
GO

PRINT 'Core tables created successfully.';
GO
