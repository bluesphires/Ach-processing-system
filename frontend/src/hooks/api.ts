import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => apiClient.get<PaginatedResponse<ACHTransaction>>('/ach', { params: filters }),
    placeholderData: (previousData) => previousData,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => apiClient.get<APIResponse<ACHTransaction>>(`/ach/${id}`),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => 
      apiClient.post<APIResponse<ACHTransaction>>('/ach', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch<APIResponse<ACHTransaction>>(`/ach/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// NACHA File hooks
export function useNACHAFiles(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['nacha-files', page, limit],
    queryFn: () => apiClient.get<PaginatedResponse<NACHAFile>>('/ach/nacha/files', { 
      params: { page, limit } 
    })
  });
}

export function useGenerateNACHAFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (effectiveDate: string) =>
      apiClient.post<APIResponse<NACHAFile>>('/ach/nacha/generate', { effectiveDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nacha-files'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDownloadNACHAFile() {
  return useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      await apiClient.downloadFile(`/ach/nacha/files/${id}/download`, filename);
    }
  });
}

// Reports hooks
export function useDailySummary(date?: string) {
  return useQuery({
    queryKey: ['daily-summary', date],
    queryFn: () => apiClient.get<APIResponse<DailySummary>>('/reports/daily-summary', {
      params: date ? { date } : {}
    })
  });
}

export function useMonthlySummary(year: number, month: number) {
  return useQuery({
    queryKey: ['monthly-summary', year, month],
    queryFn: () => apiClient.get<APIResponse<any>>('/reports/monthly-summary', {
      params: { year, month }
    })
  });
}

export function useTransactionStats() {
  return useMutation({
    mutationFn: (dateRange: { startDate: string; endDate: string }) =>
      apiClient.post<APIResponse<any>>('/reports/transaction-stats', dateRange)
  });
}

export function useNACHAStats(days = 30) {
  return useQuery({
    queryKey: ['nacha-stats', days],
    queryFn: () => apiClient.get<APIResponse<any>>('/reports/nacha-stats', { params: { days } })
  });
}

export function useExportTransactions() {
  return useMutation({
    mutationFn: async (dateRange: { startDate: string; endDate: string }) => {
      const filename = `transactions_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
      await apiClient.downloadFile('/reports/export/transactions', filename);
    }
  });
}

// Configuration hooks
export function useSystemConfigs() {
  return useQuery({
    queryKey: ['system-configs'],
    queryFn: () => apiClient.get<APIResponse<SystemConfig[]>>('/config')
  });
}

export function useSystemConfig(key: string) {
  return useQuery({
    queryKey: ['system-config', key],
    queryFn: () => apiClient.get<APIResponse<SystemConfig>>(`/config/${key}`),
    enabled: !!key,
  });
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ key, ...data }: { key: string; value: any; description?: string; isEncrypted?: boolean }) =>
      apiClient.put<APIResponse<SystemConfig>>(`/config/${key}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-configs'] });
    },
  });
}

// Federal Holidays hooks
export function useFederalHolidays() {
  return useQuery({
    queryKey: ['federal-holidays'],
    queryFn: () => apiClient.get<APIResponse<FederalHoliday[]>>('/config/holidays/list')
  });
}

export function useAddFederalHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; date: string; isRecurring: boolean }) =>
      apiClient.post<APIResponse<FederalHoliday>>('/config/holidays', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federal-holidays'] });
    },
  });
}

export function useDeleteFederalHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<APIResponse<any>>(`/config/holidays/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federal-holidays'] });
    },
  });
}

// SFTP Configuration hooks
export function useSFTPConfig() {
  return useQuery({
    queryKey: ['sftp-config'],
    queryFn: () => apiClient.get<APIResponse<SFTPConfig>>('/config/sftp')
  });
}

export function useUpdateSFTPConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SFTPConfig) => apiClient.put<APIResponse<SFTPConfig>>('/config/sftp', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sftp-config'] });
    },
  });
}

export function useTestSFTPConnection() {
  return useMutation({
    mutationFn: () => apiClient.post<APIResponse<{ success: boolean; message: string }>>('/config/sftp/test')
  });
}