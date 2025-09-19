import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '@/utils/api';
import {
  ACHTransaction,
  NACHAFile,
  APIResponse,
  PaginatedResponse,
  CreateTransactionRequest,
  TransactionFilters,
  DailySummary,
  SystemConfig,
  FederalHoliday,
  SFTPConfig
} from '@/types';

// ACH Transaction hooks
export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery(
    ['transactions', filters],
    () => apiClient.get<PaginatedResponse<ACHTransaction>>('/ach', { params: filters }),
    {
      keepPreviousData: true,
    }
  );
}

export function useTransaction(id: string) {
  return useQuery(
    ['transaction', id],
    () => apiClient.get<APIResponse<ACHTransaction>>(`/ach/${id}`),
    {
      enabled: !!id,
    }
  );
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (data: CreateTransactionRequest) => 
      apiClient.post<APIResponse<ACHTransaction>>('/ach', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['transactions']);
      },
    }
  );
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, status }: { id: string; status: string }) =>
      apiClient.patch<APIResponse<ACHTransaction>>(`/ach/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['transactions']);
      },
    }
  );
}

// NACHA File hooks
export function useNACHAFiles(page = 1, limit = 20) {
  return useQuery(
    ['nacha-files', page, limit],
    () => apiClient.get<PaginatedResponse<NACHAFile>>('/ach/nacha/files', { 
      params: { page, limit } 
    })
  );
}

export function useGenerateNACHAFile() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (effectiveDate: string) =>
      apiClient.post<APIResponse<NACHAFile>>('/ach/nacha/generate', { effectiveDate }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['nacha-files']);
        queryClient.invalidateQueries(['transactions']);
      },
    }
  );
}

export function useDownloadNACHAFile() {
  return useMutation(
    async ({ id, filename }: { id: string; filename: string }) => {
      await apiClient.downloadFile(`/ach/nacha/files/${id}/download`, filename);
    }
  );
}

// Reports hooks
export function useDailySummary(date?: string) {
  return useQuery(
    ['daily-summary', date],
    () => apiClient.get<APIResponse<DailySummary>>('/reports/daily-summary', {
      params: date ? { date } : {}
    })
  );
}

export function useMonthlySummary(year: number, month: number) {
  return useQuery(
    ['monthly-summary', year, month],
    () => apiClient.get<APIResponse<any>>('/reports/monthly-summary', {
      params: { year, month }
    })
  );
}

export function useTransactionStats() {
  return useMutation(
    (dateRange: { startDate: string; endDate: string }) =>
      apiClient.post<APIResponse<any>>('/reports/transaction-stats', dateRange)
  );
}

export function useNACHAStats(days = 30) {
  return useQuery(
    ['nacha-stats', days],
    () => apiClient.get<APIResponse<any>>('/reports/nacha-stats', { params: { days } })
  );
}

export function useExportTransactions() {
  return useMutation(
    async (dateRange: { startDate: string; endDate: string }) => {
      const filename = `transactions_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
      await apiClient.downloadFile('/reports/export/transactions', filename);
    }
  );
}

// Configuration hooks
export function useSystemConfigs() {
  return useQuery(
    ['system-configs'],
    () => apiClient.get<APIResponse<SystemConfig[]>>('/config')
  );
}

export function useSystemConfig(key: string) {
  return useQuery(
    ['system-config', key],
    () => apiClient.get<APIResponse<SystemConfig>>(`/config/${key}`),
    {
      enabled: !!key,
    }
  );
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ key, ...data }: { key: string; value: any; description?: string; isEncrypted?: boolean }) =>
      apiClient.put<APIResponse<SystemConfig>>(`/config/${key}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['system-configs']);
      },
    }
  );
}

// Federal Holidays hooks
export function useFederalHolidays() {
  return useQuery(
    ['federal-holidays'],
    () => apiClient.get<APIResponse<FederalHoliday[]>>('/config/holidays/list')
  );
}

export function useAddFederalHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (data: { name: string; date: string; isRecurring: boolean }) =>
      apiClient.post<APIResponse<FederalHoliday>>('/config/holidays', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['federal-holidays']);
      },
    }
  );
}

export function useDeleteFederalHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id: string) => apiClient.delete<APIResponse<any>>(`/config/holidays/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['federal-holidays']);
      },
    }
  );
}

// SFTP Configuration hooks
export function useSFTPConfig() {
  return useQuery(
    ['sftp-config'],
    () => apiClient.get<APIResponse<SFTPConfig>>('/config/sftp')
  );
}

export function useUpdateSFTPConfig() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (data: SFTPConfig) => apiClient.put<APIResponse<SFTPConfig>>('/config/sftp', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['sftp-config']);
      },
    }
  );
}

export function useTestSFTPConnection() {
  return useMutation(
    () => apiClient.post<APIResponse<{ success: boolean; message: string }>>('/config/sftp/test')
  );
}