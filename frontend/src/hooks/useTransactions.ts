import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys, staleTimeConfig } from '@/lib/query-client';
import { ACHTransaction, CreateTransactionRequest } from '@/types';
import { toast } from 'react-hot-toast';

// Transaction Queries
export function useTransactions(params?: {
  page?: number;
  limit?: number;
  status?: string;
  effectiveDate?: string;
}) {
  return useQuery({
    queryKey: queryKeys.transactionsList(params),
    queryFn: async () => {
      const response = await apiClient.getTransactions(params);
      return response.data;
    },
    staleTime: staleTimeConfig.frequent, // 2 minutes - transactions change frequently
    // Keep previous data while fetching new data (for pagination)
    placeholderData: (previousData) => previousData,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transactionDetail(id),
    queryFn: async () => {
      const response = await apiClient.getTransaction(id);
      return response.data;
    },
    staleTime: staleTimeConfig.normal, // 5 minutes
    enabled: !!id, // Only run query if ID is provided
  });
}

export function useTransactionStats() {
  return useQuery({
    queryKey: queryKeys.transactionStats,
    queryFn: async () => {
      const response = await apiClient.getTransactionStats();
      return response.data;
    },
    staleTime: staleTimeConfig.frequent, // 2 minutes - stats change frequently
    refetchOnWindowFocus: true, // Always get fresh stats when user returns
  });
}

// Transaction Mutations
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transactionData: CreateTransactionRequest) => {
      const response = await apiClient.createTransaction(transactionData);
      return response.data;
    },
    onSuccess: (newTransaction: ACHTransaction) => {
      // Invalidate transactions list to refetch with new transaction
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      // Invalidate stats to get updated counts
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionStats });
      
      // Optimistically add to cached transactions list if we have it
      queryClient.setQueryData<ACHTransaction[]>(
        queryKeys.transactionsList(),
        (oldData) => {
          if (oldData) {
            return [newTransaction, ...oldData];
          }
          return oldData;
        }
      );
      
      toast.success('Transaction created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to create transaction';
      toast.error(message);
    },
  });
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.updateTransactionStatus(id, status);
      return response.data;
    },
    onSuccess: (updatedTransaction: ACHTransaction, variables) => {
      // Update specific transaction in cache
      queryClient.setQueryData(
        queryKeys.transactionDetail(variables.id),
        updatedTransaction
      );
      
      // Update transaction in lists cache
      queryClient.setQueriesData<ACHTransaction[]>(
        { queryKey: queryKeys.transactions },
        (oldData) => {
          if (oldData) {
            return oldData.map(tx => 
              tx.id === variables.id ? updatedTransaction : tx
            );
          }
          return oldData;
        }
      );
      
      // Invalidate stats to get updated counts
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionStats });
      
      toast.success(`Transaction status updated to ${variables.status}`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to update transaction status';
      toast.error(message);
    },
  });
}

// Bulk operations
export function useBulkUpdateTransactions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      // Execute bulk update (assuming API supports it, otherwise loop)
      const promises = ids.map(id => apiClient.updateTransactionStatus(id, status));
      const results = await Promise.all(promises);
      return results.map(r => r.data);
    },
    onSuccess: (updatedTransactions: ACHTransaction[], variables) => {
      // Invalidate all transaction-related queries for simplicity
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionStats });
      
      toast.success(`Updated ${variables.ids.length} transactions`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to update transactions';
      toast.error(message);
    },
  });
}

// Prefetch helper for pagination
export function usePrefetchTransactions() {
  const queryClient = useQueryClient();
  
  return (params: { page: number; limit?: number; status?: string; effectiveDate?: string }) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.transactionsList(params),
      queryFn: async () => {
        const response = await apiClient.getTransactions(params);
        return response.data;
      },
      staleTime: staleTimeConfig.frequent,
    });
  };
}