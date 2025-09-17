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
  filename: string;
  content: string;
  effectiveDate: Date;
  transactionCount: number;
  totalAmount: number;
  createdAt: Date;
  transmitted: boolean;
  transmittedAt?: Date;
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
  holidays: Date[];
  excludeWeekends: boolean;
}