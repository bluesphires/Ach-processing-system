// Individual transaction entry (either debit or credit)
export interface TransactionEntry {
  id: string;
  parentTransactionId: string;
  entryType: 'DR' | 'CR';
  // Account Information
  routingNumber: string;
  accountNumber: string; // This will be masked on the frontend
  accountId: string;
  accountName: string;
  // Transaction Details
  amount: number;
  effectiveDate: string;
  // Metadata
  senderIp?: string;
  senderDetails?: string;
  createdAt: string;
  updatedAt: string;
  status: TransactionStatus;
}

// Transaction group representing the relationship between debit and credit entries
export interface TransactionGroup {
  id: string;
  drEntryId: string;
  crEntryId: string;
  drEntry?: TransactionEntry;
  crEntry?: TransactionEntry;
  // Metadata
  senderIp?: string;
  senderDetails?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy ACH Transaction interface (kept for backward compatibility)
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
// Types shared between frontend and backend
export interface Organization {
  id: string;
  organizationKey: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ACHTransaction {
  id: string;
  organizationId: string;
  traceNumber: string;
  // Debit Information
  drRoutingNumber: string;
  drAccountNumber: string; // This will be masked on the frontend
  drId: string;
  drName: string;
  // Credit Information
  crRoutingNumber: string;
  crAccountNumber: string; // This will be masked on the frontend
  crId: string;
  crName: string;
  // Transaction Details
  amount: number;
  effectiveDate: string;
  // Metadata
  senderIp?: string;
  senderDetails?: string;
  createdAt: string;
  updatedAt: string;
  status: TransactionStatus;
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface NACHAFile {
  id: string;
  organizationId: string;
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

  content?: string;
  effectiveDate: string;
  transactionCount: number;
  totalAmount: number;
  createdAt: string;
  transmitted: boolean;
  transmittedAt?: string;
}

export interface FederalHoliday {
  id: string;
  name: string;
  date: string;
  year: number;
  recurring: boolean;
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
  value: string;
  description?: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  ORGANIZATION = 'organization'
}

export interface ApiResponse<T = unknown> {
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
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Legacy create transaction request (kept for backward compatibility)
export interface CreateTransactionRequest {
  organizationKey: string;
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
  senderDetails?: string;
}

// Request to create a new transaction with separate DR and CR effective dates
export interface CreateSeparateTransactionRequest {
  // Debit Information
  drRoutingNumber: string;
  drAccountNumber: string;
  drId: string;
  drName: string;
  drEffectiveDate: string;
  // Credit Information
  crRoutingNumber: string;
  crAccountNumber: string;
  crId: string;
  crName: string;
  crEffectiveDate: string;
  // Transaction Details
  amount: number;
  // Metadata
  senderDetails?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  pendingTransactions: number;
  processedTransactions: number;
  failedTransactions: number;
  totalAmount: number;
  averageAmount: number;
}

export interface NACHAGenerationStats {
  totalFiles: number;
  transmittedFiles: number;
  pendingFiles: number;
  totalTransactionCount: number;
  totalAmount: number;
  averageFileSize: number;
}

export interface SFTPSettings {
  host: string;
  port: string;
  username: string;
  password: string;
  privateKeyPath: string;
}

export interface ACHSettings {
  immediateDestination: string;
  immediateOrigin: string;
  companyName: string;
  companyId: string;
  companyDiscretionaryData: string;
}

export interface BusinessDayInfo {
  date: string;
  isBusinessDay: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
  dayOfWeek: string;
}

export interface TransactionFilters {
  status?: string;
  effectiveDate?: string;
  organizationKey?: string;
  amountMin?: number;
  amountMax?: number;
  traceNumber?: string;
  drId?: string;
  crId?: string;
  dateFrom?: string;
  dateTo?: string;
}