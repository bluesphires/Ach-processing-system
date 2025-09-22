export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  ORGANIZATION = 'organization'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
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

export interface ACHTransaction {
  id: string;
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
  organizationId: string;
  traceNumber: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  // Debit Information
  drName: string;
  drId: string;
  drAccountNumber: string;
  drRoutingNumber: string;
  // Credit Information
  crName: string;
  crId: string;
  crAccountNumber: string;
  crRoutingNumber: string;
}

export interface NACHAFile {
  id: string;
  organizationId: string;
  filename: string;
  content: string;
  effectiveDate: string;
  transactionCount: number;
  totalAmount: number;
  status: 'pending' | 'generated' | 'transmitted' | 'failed';
  createdAt: string;
  transmitted: boolean;
  transmittedAt?: string;
  createdBy: string;
}

export interface Organization {
  id: string;
  organizationKey: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
  effectiveDate: string;
  description: string;
  organizationKey: string;
  senderIp?: string;
  senderDetails?: string;
}

export interface TransactionFilters {
  status?: TransactionStatus;
  effectiveDate?: string;
  organizationId?: string;
  amountMin?: number;
  amountMax?: number;
  traceNumber?: string;
  drId?: string;
  crId?: string;
  dateFrom?: string;
  dateTo?: string;
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
  role?: UserRole;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  message?: string;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  message?: string;
  error?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CreateTransactionRequest {
  drRoutingNumber: string;
  drAccountNumber: string;
  drId: string;
  drName: string;
  crRoutingNumber: string;
  crAccountNumber: string;
  crId: string;
  crName: string;
  amount: number;
  effectiveDate: string;
  description: string;
  organizationKey: string;
  senderIp?: string;
  senderDetails?: string;
}

export interface DailySummary {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  failedTransactions: number;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  pendingTransactions: number;
  processedTransactions: number;
  failedTransactions: number;
  cancelledTransactions: number;
}

export interface NACHAGenerationStats {
  totalFiles: number;
  totalTransactions: number;
  totalAmount: number;
  lastGenerated?: string;
}

export interface BusinessDayInfo {
  date: string;
  isBusinessDay: boolean;
  isHoliday: boolean;
  holidayName?: string;
  nextBusinessDay?: string;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Federal holiday interface
export interface FederalHoliday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

// SFTP configuration interface
export interface SFTPConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  remotePath: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ACH settings interface
export interface ACHSettings {
  immediateOrigin: string;
  immediateDestination: string;
  companyName: string;
  companyId: string;
  companyDiscretionaryData?: string;
  companyEntryDescription: string;
  companyDescriptiveDate?: string;
  effectiveEntryDate?: string;
  settlementDate?: string;
  originatorStatusCode: string;
  originatingDFIId: string;
  batchNumber: number;
}