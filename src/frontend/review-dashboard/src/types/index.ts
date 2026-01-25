export interface Analysis {
  id: number;
  ticketId: string;
  analysisTimestamp: string;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  confidenceScore?: number;
  issueType?: string;
  severityAssessment?: 'Critical' | 'High' | 'Medium' | 'Low';
  executiveSummary?: string;
  symptomAnalysisJson?: string;
  dataCorrelationsJson?: string;
  rootCauseAnalysisJson?: string;
  immediateRemediationJson?: string;
  preventionRecommendationsJson?: string;
  similarTicketsJson?: string;
  processingTimeMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  serverNames?: string;
  databaseNames?: string;
}

export interface ReviewQueue {
  id: number;
  analysisId: number;
  ticketId: string;
  queueStatus: 'pending' | 'in_review' | 'approved' | 'rejected';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  assignedTo?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  wasEdited: boolean;
  qualityRating?: number;
  enteredQueueAt: string;
  slaDeadline?: string;
  isOverdue: boolean;
  editNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  analysis?: Analysis;
}

export interface ReviewQueueDashboardView extends ReviewQueue {
  ageMinutes: number;
  slaStatus: 'Overdue' | 'Due Soon' | 'On Time';
  fullAnalysis?: string;
}

export interface SymptomAnalysis {
  issueType: string;
  affectedComponents: string[];
  severityAssessment: string;
}

export interface DataCorrelation {
  metric: string;
  observation: string;
  baseline: string;
  significance: string;
}

export interface RootCauseAnalysis {
  primaryCause: string;
  contributingFactors: string[];
  evidence: string[];
}

export interface RemediationStep {
  action: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface ImmediateRemediation {
  steps: RemediationStep[];
  estimatedImpact: string;
}

export interface PreventionRecommendations {
  shortTerm: string[];
  longTerm: string[];
}

export interface SimilarTicket {
  ticketId: string;
  resolution: string;
  relevance: string;
}

export interface UserInfo {
  userId: string;
  userName: string;
  role: 'DBChief' | 'DBNinja' | 'SystemAdmin';
  email: string;
}
