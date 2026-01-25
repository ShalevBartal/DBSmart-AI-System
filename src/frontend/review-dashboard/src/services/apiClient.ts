import axios, { AxiosInstance } from 'axios';
import { Analysis, ReviewQueue, ReviewQueueDashboardView } from '../types';

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
        // Add authentication token if available
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
          // Handle unauthorized
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Queue endpoints
  async getReviewQueue(filters?: {
    status?: string;
    priority?: string;
    customer?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ReviewQueueDashboardView[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.customer) params.append('customer', filters.customer);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await this.client.get<ReviewQueueDashboardView[]>(`/reviewqueue?${params.toString()}`);
    const total = parseInt(response.headers['x-total-count'] || '0', 10);
    return { items: response.data, total };
  }

  async getReviewQueueItem(id: number): Promise<ReviewQueueDashboardView> {
    const response = await this.client.get<ReviewQueueDashboardView>(`/reviewqueue/${id}`);
    return response.data;
  }

  async approveAnalysis(id: number, qualityRating?: number): Promise<void> {
    await this.client.post(`/reviewqueue/${id}/approve`, { qualityRating });
  }

  async rejectAnalysis(id: number, rejectionReason: string): Promise<void> {
    await this.client.post(`/reviewqueue/${id}/reject`, { rejectionReason });
  }

  async updateAndApproveAnalysis(
    id: number,
    editedAnalysis: Partial<Analysis>,
    editNotes: string,
    qualityRating?: number
  ): Promise<void> {
    await this.client.post(`/reviewqueue/${id}/update-and-approve`, {
      editedAnalysis,
      editNotes,
      qualityRating,
    });
  }

  // Analysis endpoints
  async getAnalysis(id: number): Promise<Analysis> {
    const response = await this.client.get<Analysis>(`/analyses/${id}`);
    return response.data;
  }

  async getAnalysisByTicketId(ticketId: string): Promise<Analysis> {
    const response = await this.client.get<Analysis>(`/analyses/ticket/${ticketId}`);
    return response.data;
  }

  // Authentication (placeholder for Azure AD integration)
  async getCurrentUser(): Promise<any> {
    const response = await this.client.get('/auth/user');
    return response.data;
  }
}

export const apiClient = new ApiClient();
