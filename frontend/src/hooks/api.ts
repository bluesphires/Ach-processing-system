import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  CreateTransactionRequest,
  TransactionFilters
} from '@/types';

// ACH Transaction hooks
export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => apiClient.getTransactions(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => apiClient.getTransaction(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => 
      apiClient.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateTransactionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// NACHA File hooks
export function useNACHAFiles(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['nacha-files', page, limit],
    queryFn: () => apiClient.getNACHAFiles({ page, limit })
  });
}

export function useGenerateNACHAFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { effectiveDate: string; fileType: 'DR' | 'CR' }) =>
      apiClient.generateNACHAFileFromEntries(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nacha-files'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDownloadNACHAFile() {
  return useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      const blob = await apiClient.downloadNACHAFile(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });
}

// Reports hooks
export function useDailySummary(date?: string) {
  return useQuery({
    queryKey: ['daily-summary', date],
    queryFn: () => apiClient.getTransactionStats(),
    enabled: !!date,
  });
}

export function useMonthlySummary(year: number, month: number) {
  return useQuery({
    queryKey: ['monthly-summary', year, month],
    queryFn: () => apiClient.getTransactionStats(),
    enabled: !!year && !!month,
  });
}

export function useTransactionStats() {
  return useQuery({
    queryKey: ['transaction-stats'],
    queryFn: () => apiClient.getTransactionStats()
  });
}

export function useNACHAStats(days = 30) {
  return useQuery({
    queryKey: ['nacha-stats', days],
    queryFn: () => apiClient.getNACHAGenerationStats()
  });
}

export function useExportTransactions() {
  return useMutation({
    mutationFn: async (dateRange: { startDate: string; endDate: string }) => {
      // This would need to be implemented in the API client
      console.log('Export transactions for date range:', dateRange);
    }
  });
}

// Configuration hooks
export function useSystemConfigs() {
  return useQuery({
    queryKey: ['system-configs'],
    queryFn: () => apiClient.getSystemConfig()
  });
}

export function useSystemConfig(key: string) {
  return useQuery({
    queryKey: ['system-config', key],
    queryFn: () => apiClient.getSystemConfigByKey(key),
    enabled: !!key,
  });
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: string; description?: string }) =>
      apiClient.setSystemConfig(key, value, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-configs'] });
    },
  });
}

// Federal Holidays hooks
export function useFederalHolidays() {
  return useQuery({
    queryKey: ['federal-holidays'],
    queryFn: () => apiClient.getFederalHolidays()
  });
}

export function useAddFederalHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; date: string; isRecurring: boolean }) =>
      apiClient.createFederalHoliday({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federal-holidays'] });
    },
  });
}

export function useDeleteFederalHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteFederalHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federal-holidays'] });
    },
  });
}

// SFTP Configuration hooks
export function useSFTPConfig() {
  return useQuery({
    queryKey: ['sftp-config'],
    queryFn: () => apiClient.getSFTPSettings()
  });
}

export function useUpdateSFTPConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.setSFTPSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sftp-config'] });
    },
  });
}

export function useTestSFTPConnection() {
  return useMutation({
    mutationFn: () => apiClient.testSFTPConnection()
  });
}