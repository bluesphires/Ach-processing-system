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
}