export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface ACHTransaction {
  id: string;
  transactionId: string;
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  transactionType: 'debit' | 'credit';
  amount: number;
  effectiveDate: Date;
  description: string;
  individualId: string;
  individualName: string;
  companyName?: string;
  companyId?: string;
  senderIp: string;
  timestamp: Date;
  status: 'pending' | 'processed' | 'failed' | 'cancelled';
  processedAt?: Date;
  nachaFileId?: string;
  createdBy: string;
  updatedBy?: string;
}

export interface NACHAFile {
  id: string;
  filename: string;
  effectiveDate: Date;
  totalRecords: number;
  totalDebits: number;
  totalCredits: number;
  status: 'generated' | 'transmitted' | 'failed';
  generatedAt: Date;
  transmittedAt?: Date;
  filePath: string;
  transactionIds: string[];
  createdBy: string;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description?: string;
  isEncrypted: boolean;
  updatedBy: string;
  updatedAt: Date;
}

export interface FederalHoliday {
  id: string;
  name: string;
  date: Date;
  isRecurring: boolean;
  createdAt: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateTransactionRequest {
  transactionId: string;
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  transactionType: 'debit' | 'credit';
  amount: number;
  effectiveDate: string;
  description: string;
  individualId: string;
  individualName: string;
  companyName?: string;
  companyId?: string;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface DailySummary {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  debitCount: number;
  creditCount: number;
  debitAmount: number;
  creditAmount: number;
  pendingCount: number;
  processedCount: number;
  failedCount: number;
}

export interface SFTPConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  remotePath: string;
  enabled: boolean;
}