-- ============================================================================
-- DBSmart AI Ticket Analysis System - Indexes and Performance Optimization
-- ============================================================================
-- Description: Creates indexes, constraints, and performance optimizations
-- Version: 1.0
-- Date: 2026-01-23
-- ============================================================================

USE DBSmartAI;
GO

-- ============================================================================
-- INDEXES FOR ai_analyses TABLE
-- ============================================================================

-- Index for ticket lookup
CREATE NONCLUSTERED INDEX IX_ai_analyses_ticket_id
ON ai_analyses(ticket_id)
INCLUDE (analysis_timestamp, confidence_level, status);
GO

-- Index for status queries (review queue)
CREATE NONCLUSTERED INDEX IX_ai_analyses_status
ON ai_analyses(status, created_at DESC)
INCLUDE (ticket_id, confidence_level, severity_assessment);
GO

-- Index for customer queries
CREATE NONCLUSTERED INDEX IX_ai_analyses_customer
ON ai_analyses(customer_id, created_at DESC)
INCLUDE (ticket_id, issue_type, status);
GO

-- Index for date range queries (metrics, reporting)
CREATE NONCLUSTERED INDEX IX_ai_analyses_created_at
ON ai_analyses(created_at DESC)
INCLUDE (status, confidence_level, issue_type, customer_id);
GO

-- Index for confidence level filtering
CREATE NONCLUSTERED INDEX IX_ai_analyses_confidence
ON ai_analyses(confidence_level, status)
INCLUDE (ticket_id, created_at);
GO

-- Index for issue type analysis
CREATE NONCLUSTERED INDEX IX_ai_analyses_issue_type
ON ai_analyses(issue_type, created_at DESC)
WHERE issue_type IS NOT NULL;
GO

-- ============================================================================
-- INDEXES FOR review_queue TABLE
-- ============================================================================

-- Primary queue view index (most important!)
CREATE NONCLUSTERED INDEX IX_review_queue_pending
ON review_queue(queue_status, priority, entered_queue_at DESC)
INCLUDE (ticket_id, analysis_id, assigned_to)
WHERE queue_status IN ('pending', 'in_review');
GO

-- Index for overdue tickets
CREATE NONCLUSTERED INDEX IX_review_queue_overdue
ON review_queue(sla_deadline, queue_status)
INCLUDE (ticket_id, entered_queue_at)
WHERE queue_status IN ('pending', 'in_review');
GO

-- Index for assigned tickets
CREATE NONCLUSTERED INDEX IX_review_queue_assigned
ON review_queue(assigned_to, queue_status)
INCLUDE (ticket_id, entered_queue_at);
GO

-- Index for ticket lookup
CREATE NONCLUSTERED INDEX IX_review_queue_ticket
ON review_queue(ticket_id)
INCLUDE (queue_status, analysis_id, reviewed_at);
GO

-- Index for recently reviewed
CREATE NONCLUSTERED INDEX IX_review_queue_reviewed
ON review_queue(reviewed_at DESC)
WHERE reviewed_at IS NOT NULL;
GO

-- ============================================================================
-- INDEXES FOR analysis_metrics TABLE
-- ============================================================================

-- Index for date range queries
CREATE NONCLUSTERED INDEX IX_metrics_date
ON analysis_metrics(metric_date DESC, metric_hour)
INCLUDE (total_analyses, analyses_approved, average_quality_rating);
GO

-- ============================================================================
-- INDEXES FOR feedback_log TABLE
-- ============================================================================

-- Index for analysis feedback lookup
CREATE NONCLUSTERED INDEX IX_feedback_analysis
ON feedback_log(analysis_id, submitted_at DESC);
GO

-- Index for feedback type analysis
CREATE NONCLUSTERED INDEX IX_feedback_type
ON feedback_log(feedback_type, submitted_at DESC)
INCLUDE (overall_quality, submitted_by);
GO

-- Index for user feedback history
CREATE NONCLUSTERED INDEX IX_feedback_user
ON feedback_log(submitted_by, submitted_at DESC);
GO

-- ============================================================================
-- INDEXES FOR system_config TABLE
-- ============================================================================

-- Index for category filtering
CREATE NONCLUSTERED INDEX IX_config_category
ON system_config(category, config_key);
GO

-- ============================================================================
-- INDEXES FOR audit_log TABLE
-- ============================================================================

-- Index for user activity audit
CREATE NONCLUSTERED INDEX IX_audit_user
ON audit_log(user_id, created_at DESC)
INCLUDE (event_type, action, entity_type);
GO

-- Index for event type filtering
CREATE NONCLUSTERED INDEX IX_audit_event
ON audit_log(event_type, created_at DESC)
INCLUDE (user_id, action, entity_type);
GO

-- Index for entity tracking
CREATE NONCLUSTERED INDEX IX_audit_entity
ON audit_log(entity_type, entity_id, created_at DESC)
INCLUDE (action, user_id);
GO

-- Index for date range queries
CREATE NONCLUSTERED INDEX IX_audit_date
ON audit_log(created_at DESC)
INCLUDE (event_type, user_id, action);
GO

-- ============================================================================
-- INDEXES FOR job_history TABLE
-- ============================================================================

-- Index for job type queries
CREATE NONCLUSTERED INDEX IX_job_type
ON job_history(job_type, started_at DESC)
INCLUDE (status, items_processed, duration_seconds);
GO

-- Index for status filtering
CREATE NONCLUSTERED INDEX IX_job_status
ON job_history(status, started_at DESC)
INCLUDE (job_type, items_processed);
GO

-- Index for recent jobs
CREATE NONCLUSTERED INDEX IX_job_recent
ON job_history(started_at DESC)
INCLUDE (job_type, status, items_processed, duration_seconds);
GO

-- Index for job_id lookup
CREATE NONCLUSTERED INDEX IX_job_id
ON job_history(job_id)
INCLUDE (job_type, status, started_at);
GO

-- ============================================================================
-- INDEXES FOR graphrag_sync_status TABLE
-- ============================================================================

-- Index for sync type queries
CREATE NONCLUSTERED INDEX IX_sync_type
ON graphrag_sync_status(sync_type, started_at DESC)
INCLUDE (status, tickets_indexed);
GO

-- Index for recent syncs
CREATE NONCLUSTERED INDEX IX_sync_recent
ON graphrag_sync_status(started_at DESC)
INCLUDE (sync_type, status, tickets_indexed, total_time_ms);
GO

-- ============================================================================
-- COLUMNSTORE INDEXES (for analytics/reporting)
-- ============================================================================

-- Columnstore index for analysis_metrics (fast aggregations)
CREATE NONCLUSTERED COLUMNSTORE INDEX IX_metrics_columnstore
ON analysis_metrics (
    metric_date,
    metric_hour,
    total_analyses,
    analyses_approved,
    analyses_rejected,
    average_quality_rating,
    average_processing_time_ms,
    total_input_tokens,
    total_output_tokens,
    estimated_cost_usd
);
GO

-- ============================================================================
-- FULL-TEXT INDEXES (for searching feedback comments, notes, etc.)
-- ============================================================================

-- Create full-text catalog
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'DBSmartAI_Catalog')
BEGIN
    CREATE FULLTEXT CATALOG DBSmartAI_Catalog AS DEFAULT;
END
GO

-- Full-text index on feedback comments
CREATE FULLTEXT INDEX ON feedback_log(comment, improvement_suggestions)
KEY INDEX PK__feedback__3213E83F
ON DBSmartAI_Catalog;
GO

-- Full-text index on review queue edit notes
CREATE FULLTEXT INDEX ON review_queue(edit_notes, rejection_reason)
KEY INDEX PK__review_q__3213E83F
ON DBSmartAI_Catalog;
GO

-- ============================================================================
-- COMPUTED COLUMN INDEXES
-- ============================================================================

-- Index on computed column for overdue tickets
CREATE NONCLUSTERED INDEX IX_review_queue_is_overdue
ON review_queue(is_overdue)
WHERE is_overdue = 1;
GO

-- ============================================================================
-- STATISTICS (manual creation for important columns)
-- ============================================================================

-- Create statistics on JSON columns (SQL Server can't auto-create these)
CREATE STATISTICS STAT_ai_analyses_symptom_json
ON ai_analyses(symptom_analysis_json);
GO

CREATE STATISTICS STAT_ai_analyses_rca_json
ON ai_analyses(root_cause_analysis_json);
GO

-- ============================================================================
-- CONSTRAINTS (Check Constraints for Data Quality)
-- ============================================================================

-- Ensure confidence score matches confidence level
ALTER TABLE ai_analyses
ADD CONSTRAINT CK_confidence_score_range
CHECK (
    (confidence_level = 'High' AND confidence_score >= 80) OR
    (confidence_level = 'Medium' AND confidence_score >= 50 AND confidence_score < 80) OR
    (confidence_level = 'Low' AND confidence_score < 50) OR
    confidence_score IS NULL
);
GO

-- Ensure review queue has required fields when reviewed
ALTER TABLE review_queue
ADD CONSTRAINT CK_review_required_fields
CHECK (
    (queue_status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL) OR
    queue_status IN ('pending', 'in_review')
);
GO

-- Ensure feedback has at least one rating
ALTER TABLE feedback_log
ADD CONSTRAINT CK_feedback_has_rating
CHECK (
    overall_quality IS NOT NULL OR
    accuracy_rating IS NOT NULL OR
    completeness_rating IS NOT NULL OR
    relevance_rating IS NOT NULL OR
    actionability_rating IS NOT NULL OR
    comment IS NOT NULL
);
GO

-- ============================================================================
-- TRIGGERS (for automatic timestamp updates)
-- ============================================================================

-- Trigger for ai_analyses updated_at
CREATE OR ALTER TRIGGER TR_ai_analyses_update
ON ai_analyses
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ai_analyses
    SET updated_at = GETUTCDATE()
    FROM ai_analyses a
    INNER JOIN inserted i ON a.id = i.id;
END;
GO

-- Trigger for review_queue updated_at
CREATE OR ALTER TRIGGER TR_review_queue_update
ON review_queue
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE review_queue
    SET updated_at = GETUTCDATE()
    FROM review_queue r
    INNER JOIN inserted i ON r.id = i.id;
END;
GO

-- Trigger for system_config updated_at
CREATE OR ALTER TRIGGER TR_system_config_update
ON system_config
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE system_config
    SET updated_at = GETUTCDATE()
    FROM system_config c
    INNER JOIN inserted i ON c.id = i.id;
END;
GO

-- Trigger for analysis_metrics updated_at
CREATE OR ALTER TRIGGER TR_analysis_metrics_update
ON analysis_metrics
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE analysis_metrics
    SET updated_at = GETUTCDATE()
    FROM analysis_metrics m
    INNER JOIN inserted i ON m.id = i.id;
END;
GO

-- ============================================================================
-- TRIGGER: Audit log for configuration changes
-- ============================================================================
CREATE OR ALTER TRIGGER TR_system_config_audit
ON system_config
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO audit_log (
        event_type,
        entity_type,
        entity_id,
        action,
        old_value,
        new_value,
        change_description,
        user_id,
        user_name
    )
    SELECT
        'config_change',
        'config',
        CAST(i.id AS NVARCHAR(100)),
        'update',
        d.config_value,
        i.config_value,
        'Configuration "' + i.config_key + '" changed from "' + ISNULL(d.config_value, 'NULL') + '" to "' + ISNULL(i.config_value, 'NULL') + '"',
        ISNULL(i.updated_by, SYSTEM_USER),
        ISNULL(i.updated_by, SYSTEM_USER)
    FROM inserted i
    INNER JOIN deleted d ON i.id = d.id
    WHERE i.config_value != d.config_value OR (i.config_value IS NULL AND d.config_value IS NOT NULL) OR (i.config_value IS NOT NULL AND d.config_value IS NULL);
END;
GO

-- ============================================================================
-- TRIGGER: Auto-calculate SLA deadline
-- ============================================================================
CREATE OR ALTER TRIGGER TR_review_queue_sla
ON review_queue
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE review_queue
    SET sla_deadline = DATEADD(HOUR, 24, entered_queue_at)
    FROM review_queue r
    INNER JOIN inserted i ON r.id = i.id
    WHERE r.sla_deadline IS NULL;
END;
GO

PRINT 'Indexes, constraints, and triggers created successfully.';
PRINT 'Total indexes created: Check sys.indexes for details.';
GO

-- ============================================================================
-- PERFORMANCE MONITORING QUERY (run this to check index usage)
-- ============================================================================

/*
-- Query to check index usage statistics
SELECT
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.user_updates,
    s.last_user_seek,
    s.last_user_scan
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE s.database_id = DB_ID('DBSmartAI')
    AND OBJECTPROPERTY(s.object_id, 'IsUserTable') = 1
ORDER BY s.user_seeks + s.user_scans + s.user_lookups DESC;
*/
