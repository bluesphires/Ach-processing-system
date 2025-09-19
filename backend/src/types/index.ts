export interface Organization {
  id: string;
  organizationKey: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ACHTransaction {
  id: string;
  organizationId: string;
  traceNumber: string;
// Individual transaction entry (either debit or credit)
export interface TransactionEntry {
  id: string;
  parentTransactionId: string;
  entryType: 'DR' | 'CR';
  // Account Information
  routingNumber: string;
  accountNumber: string;
  accountId: string;
  accountName: string;
  // Transaction Details
  amount: number;
  effectiveDate: Date;
  // Metadata
  senderIp?: string;
  senderDetails?: string;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

// Legacy ACH Transaction interface (kept for backward compatibility and migration)
export interface ACHTransaction {
  id: string;
  transactionId: string;
  routingNumber: string;
  accountNumber: string; // Will be encrypted in storage
  accountType: 'checking' | 'savings';
  transactionType: 'debit' | 'credit';
  amount: number;
  effectiveDate: Date;
  description: string;
  individualId: string;
  individualName: string;
  companyName?: string;
  companyId?: string;
  // Metadata
  senderIp: string;
  timestamp: Date;
  status: 'pending' | 'processed' | 'failed' | 'cancelled';
  processedAt?: Date;
  nachaFileId?: string;
  createdBy: string;
  updatedBy?: string;
}

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
  // Debit Information
  drRoutingNumber: string;
  drAccountNumber: string;
  drId: string;
  drName: string;
  // Credit Information
  crRoutingNumber: string;
  crAccountNumber: string;
  crId: string;
  crName: string;
  // Transaction Details
  amount: number;
  effectiveDate: Date;
  // Metadata
  senderIp?: string;
  senderDetails?: string;
  createdAt: Date;
  updatedAt: Date;
  status: TransactionStatus;
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Encrypted version of transaction entry
export interface EncryptedTransactionEntry extends Omit<TransactionEntry, 'accountNumber'> {
  accountNumberEncrypted: string;
}

// Legacy encrypted transaction interface (kept for backward compatibility)
export interface EncryptedTransaction extends Omit<ACHTransaction, 'drAccountNumber' | 'crAccountNumber'> {
  drAccountNumberEncrypted: string;
  crAccountNumberEncrypted: string;
}

export interface NACHAFile {
  id: string;
  organizationId: string;
  filename: string;
  content: string;
  effectiveDate: Date;
  transactionCount: number;
  totalAmount: number;
  createdAt: Date;
  transmitted: boolean;
  transmittedAt?: Date;
  encrypted?: boolean;
}

export interface FederalHoliday {
  id: string;
  name: string;
  date: Date;
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

export interface SFTPConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  remotePath: string;
  enabled: boolean;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  value: string;
  description?: string;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  organizationId?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer'
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

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request to create a new transaction with separate DR and CR effective dates
export interface CreateSeparateTransactionRequest {
  // Debit Information
  drRoutingNumber: string;
  drAccountNumber: string;
  drId: string;
  drName: string;
  drEffectiveDate: Date;
  // Credit Information
  crRoutingNumber: string;
  crAccountNumber: string;
  crId: string;
  crName: string;
  crEffectiveDate: Date;
  // Transaction Details
  amount: number;
  // Metadata
  senderDetails?: string;
}

export interface BusinessDayCalculatorOptions {
export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  
  export interface BusinessDayCalculatorOptions {
  holidays: Date[];
  excludeWeekends: boolean;
}

export interface TransactionFilters {
  status?: string;
  effectiveDate?: Date;
  organizationId?: string;
  amountMin?: number;
  amountMax?: number;
  traceNumber?: string;
  drId?: string;
  crId?: string;
  dateFrom?: Date;
  dateTo?: Date;

}