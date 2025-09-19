'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { ACHTransaction } from '@/types';
import { toast } from 'react-hot-toast';

/**
 * Optimistic UI component demonstrating React Query best practices
 * This shows how to implement optimistic updates for better UX
 */
interface OptimisticTransactionStatusProps {
  transaction: ACHTransaction;
}

export function OptimisticTransactionStatus({ transaction }: OptimisticTransactionStatusProps) {
  const queryClient = useQueryClient();
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await apiClient.updateTransactionStatus(transaction.id, newStatus);
      return response.data;
    },
    
    // Optimistic update - immediately update UI before server responds
    onMutate: async (newStatus: string) => {
      setOptimisticStatus(newStatus);
      
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.transactionDetail(transaction.id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions });

      // Snapshot the previous value
      const previousTransaction = queryClient.getQueryData<ACHTransaction>(
        queryKeys.transactionDetail(transaction.id)
      );
      const previousTransactions = queryClient.getQueryData<ACHTransaction[]>(
        queryKeys.transactionsList()
      );

      // Optimistically update the individual transaction
      if (previousTransaction) {
        queryClient.setQueryData<ACHTransaction>(
          queryKeys.transactionDetail(transaction.id),
          { ...previousTransaction, status: newStatus as any }
        );
      }

      // Optimistically update the transaction in lists
      queryClient.setQueriesData<ACHTransaction[]>(
        { queryKey: queryKeys.transactions },
        (oldData) => {
          if (oldData) {
            return oldData.map(tx => 
              tx.id === transaction.id 
                ? { ...tx, status: newStatus as any }
                : tx
            );
          }
          return oldData;
        }
      );

      // Return a context with the previous values
      return { previousTransaction, previousTransactions };
    },

    // If the mutation succeeds, clear optimistic state
    onSuccess: (updatedTransaction) => {
      setOptimisticStatus(null);
      
      // Update with real data from server
      queryClient.setQueryData(
        queryKeys.transactionDetail(transaction.id),
        updatedTransaction
      );
      
      // Update in lists
      queryClient.setQueriesData<ACHTransaction[]>(
        { queryKey: queryKeys.transactions },
        (oldData) => {
          if (oldData) {
            return oldData.map(tx => 
              tx.id === transaction.id ? updatedTransaction : tx
            );
          }
          return oldData;
        }
      );

      toast.success(`Transaction status updated to ${updatedTransaction.status}`);
    },

    // If the mutation fails, roll back optimistic updates
    onError: (error, newStatus, context) => {
      setOptimisticStatus(null);
      
      // Roll back optimistic updates
      if (context?.previousTransaction) {
        queryClient.setQueryData(
          queryKeys.transactionDetail(transaction.id),
          context.previousTransaction
        );
      }

      if (context?.previousTransactions) {
        queryClient.setQueryData(
          queryKeys.transactionsList(),
          context.previousTransactions
        );
      }

      const message = error?.response?.data?.error || 'Failed to update transaction status';
      toast.error(message);
    },

    // Always refetch after error or success to ensure we have latest data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionDetail(transaction.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionStats });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus);
  };

  // Show optimistic status if updating, otherwise show actual status
  const displayStatus = optimisticStatus || transaction.status;
  const isUpdating = updateStatusMutation.isPending || optimisticStatus !== null;

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'processed', label: 'Processed', color: 'bg-green-100 text-green-800' },
    { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  ];

  const currentStatusOption = statusOptions.find(option => option.value === displayStatus);

  return (
    <div className="flex items-center space-x-2">
      {/* Current status badge */}
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatusOption?.color || 'bg-gray-100 text-gray-800'} ${isUpdating ? 'opacity-60' : ''}`}>
        {isUpdating && (
          <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {currentStatusOption?.label || displayStatus}
      </span>

      {/* Status change dropdown */}
      <select
        value={displayStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdating}
        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Optimistic bulk actions component
 */
interface OptimisticBulkActionsProps {
  selectedTransactions: ACHTransaction[];
  onSelectionChange: (transactions: ACHTransaction[]) => void;
}

export function OptimisticBulkActions({ 
  selectedTransactions, 
  onSelectionChange 
}: OptimisticBulkActionsProps) {
  const queryClient = useQueryClient();
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, string>>({});

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      // Execute bulk update
      const promises = ids.map(id => apiClient.updateTransactionStatus(id, status));
      const results = await Promise.all(promises);
      return results.map(r => r.data);
    },

    onMutate: async ({ ids, status }) => {
      // Set optimistic updates
      const newOptimisticUpdates = ids.reduce((acc, id) => {
        acc[id] = status;
        return acc;
      }, {} as Record<string, string>);
      
      setOptimisticUpdates(prev => ({ ...prev, ...newOptimisticUpdates }));

      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions });

      // Get current data
      const previousData = queryClient.getQueryData<ACHTransaction[]>(
        queryKeys.transactionsList()
      );

      // Optimistically update all affected transactions
      queryClient.setQueriesData<ACHTransaction[]>(
        { queryKey: queryKeys.transactions },
        (oldData) => {
          if (oldData) {
            return oldData.map(tx => 
              ids.includes(tx.id) 
                ? { ...tx, status: status as any }
                : tx
            );
          }
          return oldData;
        }
      );

      return { previousData, ids };
    },

    onSuccess: (updatedTransactions, { ids, status }) => {
      // Clear optimistic updates
      setOptimisticUpdates(prev => {
        const newState = { ...prev };
        ids.forEach(id => delete newState[id]);
        return newState;
      });

      // Clear selection after successful update
      onSelectionChange([]);

      toast.success(`Updated ${ids.length} transactions to ${status}`);
    },

    onError: (error, { ids }, context) => {
      // Clear optimistic updates
      setOptimisticUpdates(prev => {
        const newState = { ...prev };
        ids.forEach(id => delete newState[id]);
        return newState;
      });

      // Restore previous data
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.transactionsList(),
          context.previousData
        );
      }

      const message = error?.response?.data?.error || 'Bulk update failed';
      toast.error(message);
    },

    onSettled: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionStats });
    },
  });

  const handleBulkUpdate = (status: string) => {
    const ids = selectedTransactions.map(tx => tx.id);
    bulkUpdateMutation.mutate({ ids, status });
  };

  if (selectedTransactions.length === 0) {
    return null;
  }

  const isUpdating = bulkUpdateMutation.isPending || Object.keys(optimisticUpdates).length > 0;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-medium text-indigo-900">
            {selectedTransactions.length} transaction{selectedTransactions.length !== 1 ? 's' : ''} selected
          </span>
          {isUpdating && (
            <svg className="animate-spin ml-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleBulkUpdate('processed')}
            disabled={isUpdating}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark Processed
          </button>
          <button
            onClick={() => handleBulkUpdate('failed')}
            disabled={isUpdating}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark Failed
          </button>
          <button
            onClick={() => onSelectionChange([])}
            disabled={isUpdating}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
}