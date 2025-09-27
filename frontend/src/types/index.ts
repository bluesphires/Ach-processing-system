// Transaction status enum
export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// User role type definition
export type UserRole = 'admin' | 'operator' | 'viewer';

// Basic types for the application
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

export interface ACHTransaction {
  id: string;
  transactionId: string;
  traceNumber?: string;
  routingNumber: string;
  accountNumber: string;
  accountName: string;
  drName?: string;
  drId?: string;
  drAccountNumber?: string;
  crName?: string;
  crId?: string;
  crAccountNumber?: string;
  amount: number;
  effectiveDate: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionEntry {
  id: string;
  parentTransactionId: string;
  entryType: 'DR' | 'CR';
  routingNumber: string;
  accountNumber: string;
  accountId: string;
  accountName: string;
  amount: number;
  effectiveDate: string;
  senderIp?: string;
  senderDetails?: string;
  createdAt: string;
  updatedAt: string;
  status: TransactionStatus;
}

export interface TransactionGroup {
  id: string;
  drEntryId: string;
  crEntryId: string;
  drEntry?: TransactionEntry;
  crEntry?: TransactionEntry;
  senderIp?: string;
  senderDetails?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NACHAFile {
  id: string;
  organizationId: string;
  filename: string;
  effectiveDate: Date;
  totalRecords: number;
  totalAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  routingNumber: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FederalHoliday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
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

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateTransactionRequest {
  routingNumber: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  effectiveDate: string;
}

export interface CreateSeparateTransactionRequest {
  drRoutingNumber: string;
  drAccountNumber: string;
  drId: string;
  drName: string;
  drEffectiveDate: string;
  crRoutingNumber: string;
  crAccountNumber: string;
  crId: string;
  crName: string;
  crEffectiveDate: string;
  amount: number;
  senderDetails?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  pendingTransactions: number;
  processedTransactions: number;
  failedTransactions: number;
  totalAmount: number;
}

export interface TransactionFilters {
  status?: TransactionStatus;
  effectiveDate?: string;
  organizationKey?: string;
  amountMin?: number;
  amountMax?: number;
  traceNumber?: string;
  drId?: string;
  crId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface NACHAGenerationStats {
  totalRecords: number;
  totalAmount: number;
  debitCount: number;
  creditCount: number;
  effectiveDate: string;
}