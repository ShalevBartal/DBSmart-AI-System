import axios, { AxiosInstance } from 'axios';
import {
  SystemConfig,
  JobHistory,
  SystemHealthMetrics,
  GraphRAGPerformanceMetrics,
  CostTracking,
  AuditLog,
  Alert,
  AlertConfig,
} from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // System Configuration
  async getSystemConfigs(category?: string): Promise<SystemConfig[]> {
    const params = category ? `?category=${category}` : '';
    const response = await this.client.get<SystemConfig[]>(`/systemconfig${params}`);
    return response.data;
  }

  async updateSystemConfig(id: number, value: string): Promise<void> {
    await this.client.put(`/systemconfig/${id}`, { configValue: value });
  }

  // Monitoring & Metrics
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    const response = await this.client.get<SystemHealthMetrics>('/monitoring/system-health');
    return response.data;
  }

  async getRecentJobs(limit: number = 50): Promise<JobHistory[]> {
    const response = await this.client.get<JobHistory[]>(`/jobs/recent?limit=${limit}`);
    return response.data;
  }

  async getGraphRAGMetrics(days: number = 30): Promise<GraphRAGPerformanceMetrics[]> {
    const response = await this.client.get<GraphRAGPerformanceMetrics[]>(`/metrics/graphrag?days=${days}`);
    return response.data;
  }

  async getCostTracking(days: number = 30): Promise<CostTracking[]> {
    const response = await this.client.get<CostTracking[]>(`/metrics/costs?days=${days}`);
    return response.data;
  }

  // Manual Triggers
  async triggerGraphRAGIndexing(params?: {
    fullReindex?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<{ jobId: string }> {
    const response = await this.client.post<{ jobId: string }>('/admin/trigger-indexing', params);
    return response.data;
  }

  async triggerAnalysis(params?: {
    ticketIds?: string[];
    forceReanalysis?: boolean;
  }): Promise<{ jobId: string }> {
    const response = await this.client.post<{ jobId: string }>('/admin/trigger-analysis', params);
    return response.data;
  }

  async triggerSimilarityUpdate(): Promise<{ jobId: string }> {
    const response = await this.client.post<{ jobId: string }>('/admin/trigger-similarity-update');
    return response.data;
  }

  async getJobStatus(jobId: string): Promise<JobHistory> {
    const response = await this.client.get<JobHistory>(`/jobs/${jobId}`);
    return response.data;
  }

  // Test Functions
  async testSQLSentryConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const response = await this.client.post('/admin/test-sql-sentry');
    return response.data;
  }

  async testZendeskAPI(): Promise<{ success: boolean; message: string; rateLimit?: string }> {
    const response = await this.client.post('/admin/test-zendesk');
    return response.data;
  }

  async testOpenAIAPI(): Promise<{ success: boolean; message: string; model?: string }> {
    const response = await this.client.post('/admin/test-openai');
    return response.data;
  }

  async testGraphRAGQuery(query: string): Promise<{ success: boolean; message: string; results?: any }> {
    const response = await this.client.post('/admin/test-graphrag', { query });
    return response.data;
  }

  // Audit Logs
  async getAuditLogs(params?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    eventType?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.userId) searchParams.append('userId', params.userId);
    if (params?.eventType) searchParams.append('eventType', params.eventType);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await this.client.get<AuditLog[]>(`/audit?${searchParams.toString()}`);
    return response.data;
  }

  // Alerts
  async getAlerts(acknowledged?: boolean): Promise<Alert[]> {
    const params = acknowledged !== undefined ? `?acknowledged=${acknowledged}` : '';
    const response = await this.client.get<Alert[]>(`/alerts${params}`);
    return response.data;
  }

  async acknowledgeAlert(id: number): Promise<void> {
    await this.client.post(`/alerts/${id}/acknowledge`);
  }

  async getAlertConfigs(): Promise<AlertConfig[]> {
    const response = await this.client.get<AlertConfig[]>('/alerts/config');
    return response.data;
  }

  async updateAlertConfig(id: number, config: Partial<AlertConfig>): Promise<void> {
    await this.client.put(`/alerts/config/${id}`, config);
  }

  // Authentication
  async getCurrentUser(): Promise<any> {
    const response = await this.client.get('/auth/user');
    return response.data;
  }
}

export const apiClient = new ApiClient();
