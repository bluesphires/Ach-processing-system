import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User, 
  Organization,
  ACHTransaction,
  TransactionEntry,
  TransactionGroup,
  CreateTransactionRequest,
  CreateSeparateTransactionRequest,
  TransactionStats,
  TransactionFilters,
  NACHAFile,
  NACHAGenerationStats,
  FederalHoliday,
  SystemConfig,
} from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // Redirect to login or trigger logout
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // Organization endpoints
  async createOrganization(organization: { name: string; description?: string; active?: boolean }): Promise<ApiResponse<Organization>> {
    const response: AxiosResponse<ApiResponse<Organization>> = await this.client.post('/api/organizations', organization);
    return response.data;
  }

  async getOrganizations(params?: { page?: number; limit?: number }): Promise<ApiResponse<Organization[]>> {
    const response: AxiosResponse<ApiResponse<Organization[]>> = await this.client.get('/api/organizations', { params });
    return response.data;
  }

  async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    const response: AxiosResponse<ApiResponse<Organization>> = await this.client.get(`/api/organizations/${id}`);
    return response.data;
  }

  async getOrganizationByKey(organizationKey: string): Promise<ApiResponse<Organization>> {
    const response: AxiosResponse<ApiResponse<Organization>> = await this.client.get(`/api/organizations/key/${organizationKey}`);
    return response.data;
  }

  async updateOrganization(id: string, updates: { name?: string; description?: string; active?: boolean }): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.put(`/api/organizations/${id}`, updates);
    return response.data;
  }
  // Auth endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.client.post('/api/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.client.post('/api/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get('/api/auth/profile');
    return response.data;
  }

  async updateProfile(updates: { name?: string; email?: string }): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.put('/api/auth/profile', updates);
    return response.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.put('/api/auth/change-password', data);
    return response.data;
  }

  // Transaction endpoints
  async createTransaction(transaction: CreateTransactionRequest): Promise<ApiResponse<ACHTransaction>> {
    const response: AxiosResponse<ApiResponse<ACHTransaction>> = await this.client.post('/api/transactions', transaction);
    return response.data;
  }

  async getTransactions(params?: TransactionFilters & {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ACHTransaction[]>> {
    const response: AxiosResponse<ApiResponse<ACHTransaction[]>> = await this.client.get('/api/transactions', { params });
    return response.data;
  }

  async getTransaction(id: string): Promise<ApiResponse<ACHTransaction>> {
    const response: AxiosResponse<ApiResponse<ACHTransaction>> = await this.client.get(`/api/transactions/${id}`);
    return response.data;
  }

  async updateTransactionStatus(id: string, status: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.patch(`/api/transactions/${id}/status`, { status });
    return response.data;
  }

  async getTransactionStats(): Promise<ApiResponse<TransactionStats>> {
    const response: AxiosResponse<ApiResponse<TransactionStats>> = await this.client.get('/api/transactions/stats/summary');
    return response.data;
  }

  // Transaction Entry endpoints (new separate debit/credit structure)
  async createSeparateTransaction(transaction: CreateSeparateTransactionRequest): Promise<ApiResponse<TransactionGroup>> {
    const response: AxiosResponse<ApiResponse<TransactionGroup>> = await this.client.post('/api/transactions/separate', transaction);
    return response.data;
  }

  async getTransactionEntries(params?: {
    page?: number;
    limit?: number;
    status?: string;
    effectiveDate?: string;
    entryType?: 'DR' | 'CR';
  }): Promise<ApiResponse<TransactionEntry[]>> {
    const response: AxiosResponse<ApiResponse<TransactionEntry[]>> = await this.client.get('/api/transactions/entries', { params });
    return response.data;
  }

  async getTransactionGroups(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<TransactionGroup[]>> {
    const response: AxiosResponse<ApiResponse<TransactionGroup[]>> = await this.client.get('/api/transactions/groups', { params });
    return response.data;
  }

  // NACHA endpoints
  async generateNACHAFile(data: { effectiveDate: string; fileType: 'DR' | 'CR' }): Promise<ApiResponse<NACHAFile>> {
    const response: AxiosResponse<ApiResponse<NACHAFile>> = await this.client.post('/api/nacha/generate', data);
    return response.data;
  }

  async generateNACHAFileFromEntries(data: { effectiveDate: string; fileType: 'DR' | 'CR' }): Promise<ApiResponse<NACHAFile>> {
    const response: AxiosResponse<ApiResponse<NACHAFile>> = await this.client.post('/api/nacha/generate-from-entries', data);
    return response.data;
  }

  async getNACHAFiles(params?: { page?: number; limit?: number }): Promise<ApiResponse<NACHAFile[]>> {
    const response: AxiosResponse<ApiResponse<NACHAFile[]>> = await this.client.get('/api/nacha/files', { params });
    return response.data;
  }

  async getNACHAFile(id: string): Promise<ApiResponse<NACHAFile>> {
    const response: AxiosResponse<ApiResponse<NACHAFile>> = await this.client.get(`/api/nacha/files/${id}`);
    return response.data;
  }

  async downloadNACHAFile(id: string): Promise<Blob> {
    const response = await this.client.get(`/api/nacha/files/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async validateNACHAFile(id: string): Promise<ApiResponse<{ isValid: boolean; errors: string[]; filename: string }>> {
    const response: AxiosResponse<ApiResponse<{ isValid: boolean; errors: string[]; filename: string }>> = 
      await this.client.post(`/api/nacha/files/${id}/validate`);
    return response.data;
  }

  async markNACHAFileTransmitted(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.patch(`/api/nacha/files/${id}/transmitted`);
    return response.data;
  }

  async getNACHAGenerationStats(): Promise<ApiResponse<NACHAGenerationStats>> {
    const response: AxiosResponse<ApiResponse<NACHAGenerationStats>> = await this.client.get('/api/nacha/stats/generation');
    return response.data;
  }

  // Federal holidays endpoints
  async getFederalHolidays(year?: number): Promise<ApiResponse<FederalHoliday[]>> {
    const response: AxiosResponse<ApiResponse<FederalHoliday[]>> = await this.client.get('/api/holidays', {
      params: year ? { year } : undefined
    });
    return response.data;
  }

  async createFederalHoliday(holiday: Omit<FederalHoliday, 'id'>): Promise<ApiResponse<FederalHoliday>> {
    const response: AxiosResponse<ApiResponse<FederalHoliday>> = await this.client.post('/api/holidays', holiday);
    return response.data;
  }

  async updateFederalHoliday(id: string, updates: Partial<FederalHoliday>): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.put(`/api/holidays/${id}`, updates);
    return response.data;
  }

  async deleteFederalHoliday(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(`/api/holidays/${id}`);
    return response.data;
  }

  async generateDefaultHolidays(year: number): Promise<ApiResponse<FederalHoliday[]>> {
    const response: AxiosResponse<ApiResponse<FederalHoliday[]>> = await this.client.post(`/api/holidays/generate/${year}`);
    return response.data;
  }

  async checkBusinessDay(date: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.client.get(`/api/holidays/business-day/check/${date}`);
    return response.data;
  }

  async calculateBusinessDays(startDate: string, endDate: string): Promise<ApiResponse<{ startDate: string; endDate: string; businessDays: number }>> {
    const response: AxiosResponse<ApiResponse<{ startDate: string; endDate: string; businessDays: number }>> = 
      await this.client.get('/api/holidays/business-day/calculate', {
        params: { startDate, endDate }
      });
    return response.data;
  }

  async getNextBusinessDay(date: string): Promise<ApiResponse<{ inputDate: string; nextBusinessDay: string }>> {
    const response: AxiosResponse<ApiResponse<{ inputDate: string; nextBusinessDay: string }>> = 
      await this.client.get(`/api/holidays/business-day/next/${date}`);
    return response.data;
  }

  // System configuration endpoints
  async getSystemConfig(): Promise<ApiResponse<SystemConfig[]>> {
    const response: AxiosResponse<ApiResponse<SystemConfig[]>> = await this.client.get('/api/config');
    return response.data;
  }

  async getSystemConfigByKey(key: string): Promise<ApiResponse<SystemConfig>> {
    const response: AxiosResponse<ApiResponse<SystemConfig>> = await this.client.get(`/api/config/${key}`);
    return response.data;
  }

  async setSystemConfig(key: string, value: string, description?: string): Promise<ApiResponse<SystemConfig>> {
    const response: AxiosResponse<ApiResponse<SystemConfig>> = await this.client.put(`/api/config/${key}`, {
      value,
      description
    });
    return response.data;
  }

  async setSFTPSettings(settings: any): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.put('/api/config/sftp/settings', settings);
    return response.data;
  }

  async getSFTPSettings(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/api/config/sftp/settings');
    return response.data;
  }

  async testSFTPConnection(): Promise<ApiResponse<{ host: string; port: number; username: string; connected: boolean; testTime: string }>> {
    const response: AxiosResponse<ApiResponse<{ host: string; port: number; username: string; connected: boolean; testTime: string }>> = 
      await this.client.post('/api/config/sftp/test');
    return response.data;
  }

  async setACHSettings(settings: any): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.put('/api/config/ach/settings', settings);
    return response.data;
  }

  async getACHSettings(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/api/config/ach/settings');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();