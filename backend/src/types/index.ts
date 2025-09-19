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