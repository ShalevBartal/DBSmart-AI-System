-- ============================================================================
-- DBSmart AI Ticket Analysis System - Views for Common Queries
-- ============================================================================
-- Description: Creates views for frequently used queries and dashboards
-- Version: 1.0
-- Date: 2026-01-23
-- ============================================================================

USE DBSmartAI;
GO

-- ============================================================================
-- VIEW: vw_review_queue_dashboard
-- Description: Main view for the Review Queue Dashboard (DBChief interface)
-- ============================================================================
CREATE OR ALTER VIEW vw_review_queue_dashboard
AS
SELECT
    rq.id AS review_queue_id,
    rq.analysis_id,
    rq.ticket_id,
    rq.queue_status,
    rq.priority,
    rq.assigned_to,
    rq.reviewed_by,
    rq.reviewed_at,
    rq.was_edited,
    rq.quality_rating,
    rq.entered_queue_at,
    rq.sla_deadline,
    rq.is_overdue,

    -- Analysis details
    a.confidence_level,
    a.confidence_score,
    a.issue_type,
    a.severity_assessment,
    a.executive_summary,
    a.customer_name,
    a.server_names,
    a.database_names,
    a.created_at AS analysis_created_at,

    -- Calculated fields
    DATEDIFF(MINUTE, rq.entered_queue_at, GETUTCDATE()) AS age_minutes,
    CASE
        WHEN rq.is_overdue = 1 THEN 'Overdue'
        WHEN DATEDIFF(MINUTE, rq.entered_queue_at, rq.sla_deadline) <= 60 THEN 'Due Soon'
        ELSE 'On Time'
    END AS sla_status,

    -- JSON for frontend
    (
        SELECT
            a.symptom_analysis_json,
            a.data_correlations_json,
            a.root_cause_analysis_json,
            a.immediate_remediation_json,
            a.prevention_recommendations_json,
            a.similar_tickets_json
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS full_analysis
FROM review_queue rq
INNER JOIN ai_analyses a ON rq.analysis_id = a.id
WHERE rq.queue_status IN ('pending', 'in_review');
GO

-- ============================================================================
-- VIEW: vw_system_health_dashboard
-- Description: System health metrics for Admin Control Panel
-- ============================================================================
CREATE OR ALTER VIEW vw_system_health_dashboard
AS
WITH RecentJobs AS (
    SELECT
        job_type,
        status,
        COUNT(*) AS job_count,
        AVG(CAST(duration_seconds AS FLOAT)) AS avg_duration_seconds,
        MAX(started_at) AS last_run
    FROM job_history
    WHERE started_at >= DATEADD(DAY, -7, GETUTCDATE())
    GROUP BY job_type, status
),
RecentAnalyses AS (
    SELECT
        COUNT(*) AS total_last_24h,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_last_24h,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_last_24h,
        AVG(CAST(processing_time_ms AS FLOAT)) AS avg_processing_time_ms,
        AVG(CAST(confidence_score AS FLOAT)) AS avg_confidence_score
    FROM ai_analyses
    WHERE created_at >= DATEADD(DAY, -1, GETUTCDATE())
),
RecentErrors AS (
    SELECT COUNT(*) AS error_count_24h
    FROM job_history
    WHERE status = 'failed'
        AND started_at >= DATEADD(DAY, -1, GETUTCDATE())
)
SELECT
    -- Job Statistics
    (SELECT job_count FROM RecentJobs WHERE job_type = 'graphrag_indexing' AND status = 'completed') AS indexing_jobs_success_7d,
    (SELECT job_count FROM RecentJobs WHERE job_type = 'graphrag_indexing' AND status = 'failed') AS indexing_jobs_failed_7d,
    (SELECT last_run FROM RecentJobs WHERE job_type = 'graphrag_indexing') AS last_indexing_run,

    (SELECT job_count FROM RecentJobs WHERE job_type = 'ai_analysis' AND status = 'completed') AS analysis_jobs_success_7d,
    (SELECT job_count FROM RecentJobs WHERE job_type = 'ai_analysis' AND status = 'failed') AS analysis_jobs_failed_7d,
    (SELECT last_run FROM RecentJobs WHERE job_type = 'ai_analysis') AS last_analysis_run,

    -- Analysis Statistics
    (SELECT total_last_24h FROM RecentAnalyses) AS total_analyses_24h,
    (SELECT approved_last_24h FROM RecentAnalyses) AS approved_analyses_24h,
    (SELECT rejected_last_24h FROM RecentAnalyses) AS rejected_analyses_24h,
    (SELECT avg_processing_time_ms FROM RecentAnalyses) AS avg_processing_time_ms_24h,
    (SELECT avg_confidence_score FROM RecentAnalyses) AS avg_confidence_score_24h,

    -- Error Count
    (SELECT error_count_24h FROM RecentErrors) AS total_errors_24h,

    -- Current Queue
    (SELECT COUNT(*) FROM review_queue WHERE queue_status = 'pending') AS pending_reviews,
    (SELECT COUNT(*) FROM review_queue WHERE queue_status = 'in_review') AS in_review,
    (SELECT COUNT(*) FROM review_queue WHERE is_overdue = 1) AS overdue_reviews;
GO

-- ============================================================================
-- VIEW: vw_analysis_quality_metrics
-- Description: Quality metrics for AI analyses (for reporting and monitoring)
-- ============================================================================
CREATE OR ALTER VIEW vw_analysis_quality_metrics
AS
WITH DailyMetrics AS (
    SELECT
        CAST(created_at AS DATE) AS metric_date,
        COUNT(*) AS total_analyses,
        SUM(CASE WHEN confidence_level = 'High' THEN 1 ELSE 0 END) AS high_confidence,
        SUM(CASE WHEN confidence_level = 'Medium' THEN 1 ELSE 0 END) AS medium_confidence,
        SUM(CASE WHEN confidence_level = 'Low' THEN 1 ELSE 0 END) AS low_confidence,
        AVG(CAST(confidence_score AS FLOAT)) AS avg_confidence_score,
        AVG(CAST(processing_time_ms AS FLOAT)) AS avg_processing_time_ms,
        AVG(CAST(total_tokens AS FLOAT)) AS avg_total_tokens
    FROM ai_analyses
    WHERE created_at >= DATEADD(DAY, -30, GETUTCDATE())
    GROUP BY CAST(created_at AS DATE)
),
ApprovalMetrics AS (
    SELECT
        CAST(rq.reviewed_at AS DATE) AS metric_date,
        COUNT(*) AS total_reviewed,
        SUM(CASE WHEN rq.queue_status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN rq.queue_status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN rq.was_edited = 1 THEN 1 ELSE 0 END) AS edited,
        AVG(CAST(rq.quality_rating AS FLOAT)) AS avg_quality_rating
    FROM review_queue rq
    WHERE rq.reviewed_at >= DATEADD(DAY, -30, GETUTCDATE())
        AND rq.reviewed_at IS NOT NULL
    GROUP BY CAST(rq.reviewed_at AS DATE)
)
SELECT
    d.metric_date,
    d.total_analyses,
    d.high_confidence,
    d.medium_confidence,
    d.low_confidence,
    d.avg_confidence_score,
    d.avg_processing_time_ms,
    d.avg_total_tokens,

    a.total_reviewed,
    a.approved,
    a.rejected,
    a.edited,
    a.avg_quality_rating,

    -- Calculated metrics
    CASE WHEN a.total_reviewed > 0
        THEN CAST(a.approved AS FLOAT) / a.total_reviewed * 100
        ELSE NULL
    END AS approval_rate_pct,

    CASE WHEN a.total_reviewed > 0
        THEN CAST(a.edited AS FLOAT) / a.total_reviewed * 100
        ELSE NULL
    END AS edit_rate_pct
FROM DailyMetrics d
LEFT JOIN ApprovalMetrics a ON d.metric_date = a.metric_date;
GO

-- ============================================================================
-- VIEW: vw_graphrag_performance_metrics
-- Description: GraphRAG indexing and query performance metrics
-- ============================================================================
CREATE OR ALTER VIEW vw_graphrag_performance_metrics
AS
SELECT
    sync_type,
    status,
    tickets_indexed,
    embeddings_generated,
    relationships_created,
    entities_extracted,

    -- Performance metrics
    fetch_time_ms,
    indexing_time_ms,
    total_time_ms,

    -- Calculated
    CASE WHEN tickets_indexed > 0
        THEN CAST(total_time_ms AS FLOAT) / tickets_indexed
        ELSE NULL
    END AS avg_time_per_ticket_ms,

    errors_count,
    started_at,
    completed_at,
    DATEDIFF(SECOND, started_at, completed_at) AS duration_seconds
FROM graphrag_sync_status
WHERE started_at >= DATEADD(DAY, -30, GETUTCDATE());
GO

-- ============================================================================
-- VIEW: vw_cost_tracking
-- Description: Cost tracking and token usage for Admin Control Panel
-- ============================================================================
CREATE OR ALTER VIEW vw_cost_tracking
AS
WITH DailyCosts AS (
    SELECT
        CAST(created_at AS DATE) AS cost_date,
        SUM(CAST(input_tokens AS BIGINT)) AS total_input_tokens,
        SUM(CAST(output_tokens AS BIGINT)) AS total_output_tokens,
        SUM(CAST(total_tokens AS BIGINT)) AS total_tokens,
        COUNT(*) AS analyses_count,

        -- Cost calculation (GPT-4o pricing: $5/1M input, $15/1M output)
        SUM(CAST(input_tokens AS FLOAT)) / 1000000.0 * 5.0 +
        SUM(CAST(output_tokens AS FLOAT)) / 1000000.0 * 15.0 AS estimated_openai_cost_usd
    FROM ai_analyses
    WHERE created_at >= DATEADD(DAY, -30, GETUTCDATE())
        AND total_tokens IS NOT NULL
    GROUP BY CAST(created_at AS DATE)
)
SELECT
    cost_date,
    total_input_tokens,
    total_output_tokens,
    total_tokens,
    analyses_count,
    estimated_openai_cost_usd,

    -- Running total for month-to-date
    SUM(estimated_openai_cost_usd) OVER (
        PARTITION BY YEAR(cost_date), MONTH(cost_date)
        ORDER BY cost_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS mtd_cost_usd,

    -- Average cost per analysis
    CASE WHEN analyses_count > 0
        THEN estimated_openai_cost_usd / analyses_count
        ELSE NULL
    END AS cost_per_analysis_usd
FROM DailyCosts;
GO

-- ============================================================================
-- VIEW: vw_issue_type_distribution
-- Description: Distribution of issue types for analytics
-- ============================================================================
CREATE OR ALTER VIEW vw_issue_type_distribution
AS
SELECT
    issue_type,
    COUNT(*) AS count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS percentage,
    AVG(CAST(confidence_score AS FLOAT)) AS avg_confidence_score,

    -- Breakdown by severity
    SUM(CASE WHEN severity_assessment = 'Critical' THEN 1 ELSE 0 END) AS critical_count,
    SUM(CASE WHEN severity_assessment = 'High' THEN 1 ELSE 0 END) AS high_count,
    SUM(CASE WHEN severity_assessment = 'Medium' THEN 1 ELSE 0 END) AS medium_count,
    SUM(CASE WHEN severity_assessment = 'Low' THEN 1 ELSE 0 END) AS low_count
FROM ai_analyses
WHERE created_at >= DATEADD(DAY, -30, GETUTCDATE())
    AND issue_type IS NOT NULL
GROUP BY issue_type;
GO

-- ============================================================================
-- VIEW: vw_customer_ticket_volume
-- Description: Top customers by ticket volume (for business impact metrics)
-- ============================================================================
CREATE OR ALTER VIEW vw_customer_ticket_volume
AS
SELECT TOP 100
    customer_id,
    customer_name,
    COUNT(*) AS total_tickets,

    -- Issue breakdown
    SUM(CASE WHEN issue_type = 'Performance' THEN 1 ELSE 0 END) AS performance_issues,
    SUM(CASE WHEN issue_type = 'Deadlock' THEN 1 ELSE 0 END) AS deadlock_issues,
    SUM(CASE WHEN issue_type = 'Availability' THEN 1 ELSE 0 END) AS availability_issues,

    -- Severity distribution
    SUM(CASE WHEN severity_assessment = 'Critical' THEN 1 ELSE 0 END) AS critical_tickets,
    SUM(CASE WHEN severity_assessment = 'High' THEN 1 ELSE 0 END) AS high_severity_tickets,

    -- Quality metrics
    AVG(CAST(confidence_score AS FLOAT)) AS avg_confidence_score,

    -- Time metrics
    MIN(created_at) AS first_ticket_date,
    MAX(created_at) AS last_ticket_date,

    -- Trend (tickets in last 7 days vs prior 7 days)
    SUM(CASE WHEN created_at >= DATEADD(DAY, -7, GETUTCDATE()) THEN 1 ELSE 0 END) AS tickets_last_7d,
    SUM(CASE WHEN created_at >= DATEADD(DAY, -14, GETUTCDATE())
                  AND created_at < DATEADD(DAY, -7, GETUTCDATE()) THEN 1 ELSE 0 END) AS tickets_prior_7d
FROM ai_analyses
WHERE created_at >= DATEADD(DAY, -30, GETUTCDATE())
    AND customer_id IS NOT NULL
GROUP BY customer_id, customer_name
ORDER BY total_tickets DESC;
GO

-- ============================================================================
-- VIEW: vw_feedback_summary
-- Description: Summary of DBChief feedback for continuous improvement
-- ============================================================================
CREATE OR ALTER VIEW vw_feedback_summary
AS
SELECT
    feedback_type,
    COUNT(*) AS feedback_count,
    AVG(CAST(overall_quality AS FLOAT)) AS avg_overall_quality,
    AVG(CAST(accuracy_rating AS FLOAT)) AS avg_accuracy,
    AVG(CAST(completeness_rating AS FLOAT)) AS avg_completeness,
    AVG(CAST(relevance_rating AS FLOAT)) AS avg_relevance,
    AVG(CAST(actionability_rating AS FLOAT)) AS avg_actionability,

    -- Similar tickets feedback
    SUM(CASE WHEN similar_tickets_helpful = 1 THEN 1 ELSE 0 END) AS similar_tickets_helpful_count,
    AVG(CAST(similar_tickets_relevance AS FLOAT)) AS avg_similar_tickets_relevance,

    -- RCA feedback
    SUM(CASE WHEN rca_accurate = 1 THEN 1 ELSE 0 END) AS rca_accurate_count,
    AVG(CAST(rca_depth AS FLOAT)) AS avg_rca_depth,

    -- Remediation feedback
    SUM(CASE WHEN remediation_actionable = 1 THEN 1 ELSE 0 END) AS remediation_actionable_count,
    AVG(CAST(remediation_safety AS FLOAT)) AS avg_remediation_safety,

    -- Time range
    MIN(submitted_at) AS earliest_feedback,
    MAX(submitted_at) AS latest_feedback
FROM feedback_log
WHERE submitted_at >= DATEADD(DAY, -30, GETUTCDATE())
GROUP BY feedback_type;
GO

-- ============================================================================
-- VIEW: vw_audit_recent_activity
-- Description: Recent audit activity for Admin Control Panel
-- ============================================================================
CREATE OR ALTER VIEW vw_audit_recent_activity
AS
SELECT TOP 100
    id,
    event_type,
    entity_type,
    entity_id,
    action,
    change_description,
    user_id,
    user_name,
    user_role,
    ip_address,
    created_at,

    -- Format for display
    user_name + ' (' + ISNULL(user_role, 'Unknown') + ') performed ' +
    action + ' on ' + ISNULL(entity_type, 'unknown entity') +
    CASE WHEN entity_id IS NOT NULL THEN ' [' + entity_id + ']' ELSE '' END AS activity_summary
FROM audit_log
ORDER BY created_at DESC;
GO

-- ============================================================================
-- VIEW: vw_job_history_summary
-- Description: Job execution summary for last 30 days
-- ============================================================================
CREATE OR ALTER VIEW vw_job_history_summary
AS
SELECT
    job_type,
    status,
    COUNT(*) AS execution_count,
    AVG(CAST(duration_seconds AS FLOAT)) AS avg_duration_seconds,
    AVG(CAST(items_processed AS FLOAT)) AS avg_items_processed,
    MAX(started_at) AS last_execution,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,

    -- Success rate
    CAST(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 AS success_rate_pct
FROM job_history
WHERE started_at >= DATEADD(DAY, -30, GETUTCDATE())
GROUP BY job_type, status;
GO

PRINT 'Views created successfully.';
PRINT 'Total views created: 12';
GO
