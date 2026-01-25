// System Configuration Types
export interface SystemConfig {
  id: number;
  category: string;
  configKey: string;
  configValue?: string;
  description?: string;
  dataType: string;
  validationRule?: string;
  isSecret: boolean;
  updatedBy?: string;
  updatedAt: string;
}

export interface GraphRAGSettings {
  similarityThreshold: number;
  indexingSchedule: string;
  searchScope: number;
  entityExtractionPatterns: Record<string, string>;
}

export interface AIAnalysisSettings {
  confidenceScoreWeights: {
    dataCompleteness: number;
    correlation: number;
    similarity: number;
  };
  sqlSentryTimeWindow: number;
  maxConcurrentAnalyses: number;
  timeoutSeconds: number;
  openAITemperature: number;
  openAIMaxTokens: number;
}

// Job and Monitoring Types
export interface JobHistory {
  id: number;
  jobId: string;
  jobType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  itemsProcessed?: number;
  errorMessage?: string;
  metadata?: string;
}

export interface SystemHealthMetrics {
  indexingJobsSuccess7d?: number;
  indexingJobsFailed7d?: number;
  lastIndexingRun?: string;
  analysisJobsSuccess7d?: number;
  analysisJobsFailed7d?: number;
  lastAnalysisRun?: string;
  totalAnalyses24h?: number;
  approvedAnalyses24h?: number;
  rejectedAnalyses24h?: number;
  avgProcessingTimeMs24h?: number;
  avgConfidenceScore24h?: number;
  totalErrors24h?: number;
  pendingReviews?: number;
  inReview?: number;
  overdueReviews?: number;
}

export interface GraphRAGPerformanceMetrics {
  syncType: string;
  status: string;
  ticketsIndexed?: number;
  embeddingsGenerated?: number;
  relationshipsCreated?: number;
  entitiesExtracted?: number;
  fetchTimeMs?: number;
  indexingTimeMs?: number;
  totalTimeMs?: number;
  avgTimePerTicketMs?: number;
  errorsCount?: number;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
}

export interface CostTracking {
  costDate: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  analysesCount: number;
  estimatedOpenAICostUsd: number;
  mtdCostUsd: number;
  costPerAnalysisUsd: number;
}

// Alert Types
export interface Alert {
  id: number;
  alertType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface AlertConfig {
  id: number;
  alertType: string;
  enabled: boolean;
  threshold?: number;
  emailRecipients?: string[];
  slackWebhook?: string;
  smsRecipients?: string[];
}

// Audit Log Types
export interface AuditLog {
  id: number;
  eventType: string;
  entityType?: string;
  entityId?: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  changeDescription?: string;
  userId: string;
  userName: string;
  userRole?: string;
  ipAddress?: string;
  createdAt: string;
}

// User Types
export interface UserInfo {
  userId: string;
  userName: string;
  role: 'DBChief' | 'DBNinja' | 'SystemAdmin';
  email: string;
}

// Analysis Metrics Types
export interface AnalysisMetrics {
  id: number;
  metricDate: string;
  metricHour?: number;
  totalAnalyses: number;
  analysesApproved: number;
  analysesRejected: number;
  analysesEdited: number;
  averageQualityRating?: number;
  averageProcessingTimeMs?: number;
  averageConfidenceScore?: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
}

// GraphRAG Sync Status
export interface GraphRAGSyncStatus {
  id: number;
  syncType: string;
  status: string;
  ticketsIndexed?: number;
  embeddingsGenerated?: number;
  relationshipsCreated?: number;
  entitiesExtracted?: number;
  fetchTimeMs?: number;
  indexingTimeMs?: number;
  totalTimeMs?: number;
  errorsCount?: number;
  errorDetails?: string;
  startedAt: string;
  completedAt?: string;
  metadata?: string;
}
