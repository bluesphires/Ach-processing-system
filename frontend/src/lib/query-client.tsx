'use client';

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client with optimized defaults for the ACH processing system
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time for cached data (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Cache time before garbage collection (10 minutes)
      gcTime: 10 * 60 * 1000,
      // Retry failed requests up to 3 times
      retry: (failureCount, error: any) => {
        // Don't retry on 401, 403, 404 errors
        if (error?.response?.status && [401, 403, 404].includes(error.response.status)) {
          return false;
        }
        return failureCount < 3;
      },
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for critical data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default (can be overridden per query)
      refetchOnReconnect: false,
    },
    mutations: {
      // Default retry configuration for mutations
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors (4xx)
        if (error?.response?.status && error.response.status >= 400 && error.response.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Custom configuration for different data types
export const queryKeys = {
  // Authentication
  auth: ['auth'] as const,
  currentUser: ['auth', 'currentUser'] as const,

  // Transactions
  transactions: ['transactions'] as const,
  transactionsList: (filters?: any) => ['transactions', 'list', filters] as const,
  transactionDetail: (id: string) => ['transactions', 'detail', id] as const,
  transactionStats: ['transactions', 'stats'] as const,

  // NACHA Files
  nachaFiles: ['nacha'] as const,
  nachaFilesList: (filters?: any) => ['nacha', 'list', filters] as const,
  nachaFileDetail: (id: string) => ['nacha', 'detail', id] as const,
  nachaFileValidation: (id: string) => ['nacha', 'validation', id] as const,
  
  // System Configuration
  systemConfig: ['config'] as const,
  allSystemConfig: ['config', 'all'] as const,
  specificConfig: (key: string) => ['config', key] as const,
  
  // Federal Holidays
  holidays: ['holidays'] as const,
  holidaysList: (year?: number) => ['holidays', 'list', year] as const,
  
  // Business Days
  businessDays: ['businessDays'] as const,
  businessDayCheck: (date: string) => ['businessDays', 'check', date] as const,
  nextBusinessDay: (date: string) => ['businessDays', 'next', date] as const,
} as const;

// Stale time configurations for different data types
export const staleTimeConfig = {
  // Real-time data (refresh every 30 seconds)
  realTime: 30 * 1000,
  // Frequently changing data (refresh every 2 minutes)
  frequent: 2 * 60 * 1000,
  // Normal data (refresh every 5 minutes)
  normal: 5 * 60 * 1000,
  // Stable data (refresh every 15 minutes)
  stable: 15 * 60 * 1000,
  // Static data (refresh every hour)
  static: 60 * 60 * 1000,
} as const;

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export { queryClient };