import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { useRequireAuth } from '@/context/AuthContext';
import { useTransactions, useUpdateTransactionStatus } from '@/hooks/api';
import { ACHTransaction, TransactionFilters } from '@/types';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const typeColors = {
  debit: 'text-red-600',
  credit: 'text-green-600',
};

interface TransactionRowProps {
  transaction: ACHTransaction;
  onStatusUpdate: (id: string, status: string) => void;
  canEdit: boolean;
}

function TransactionRow({ transaction, onStatusUpdate, canEdit }: TransactionRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === transaction.status) return;
    
    setIsUpdating(true);
    try {
      await onStatusUpdate(transaction.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <tr className="table-row">
      <td className="table-cell">
        <div className="text-sm font-medium text-gray-900">
          {transaction.transactionId}
        </div>
        <div className="text-sm text-gray-500">
          {format(new Date(transaction.timestamp), 'MMM d, yyyy HH:mm')}
        </div>
      </td>
      <td className="table-cell">
        <div className="text-sm text-gray-900">{transaction.individualName}</div>
        <div className="text-sm text-gray-500">ID: {transaction.individualId}</div>
      </td>
      <td className="table-cell">
        <span className={`text-sm font-medium ${typeColors[transaction.transactionType]}`}>
          {transaction.transactionType.toUpperCase()}
        </span>
        <div className="text-sm text-gray-500 capitalize">
          {transaction.accountType}
        </div>
      </td>
      <td className="table-cell">
        <div className={`text-sm font-medium ${typeColors[transaction.transactionType]}`}>
          {transaction.transactionType === 'debit' ? '-' : '+'}
          ${transaction.amount.toLocaleString()}
        </div>
      </td>
      <td className="table-cell">
        <div className="text-sm text-gray-900">
          {format(new Date(transaction.effectiveDate), 'MMM d, yyyy')}
        </div>
      </td>
      <td className="table-cell">
        {canEdit ? (
          <select
            value={transaction.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className="text-sm border-0 bg-transparent focus:ring-2 focus:ring-primary-500 rounded"
          >
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        ) : (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[transaction.status]}`}>
            {transaction.status}
          </span>
        )}
      </td>
      <td className="table-cell">
        <Link
          href={`/transactions/${transaction.id}`}
          className="text-primary-600 hover:text-primary-900 text-sm font-medium"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

export default function TransactionsPage() {
  const auth = useRequireAuth();
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 50,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: transactionsData, isLoading, refetch } = useTransactions(filters);
  const updateStatusMutation = useUpdateTransactionStatus();

  const canEdit = auth.hasRole(['admin', 'operator']);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success('Transaction status updated');
      refetch();
    } catch (error: any) {
      toast.error('Failed to update transaction status');
    }
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (auth.isLoading) {
    return <Layout title="Transactions"><div>Loading...</div></Layout>;
  }

  return (
    <>
      <Head>
        <title>Transactions - ACH Processing System</title>
      </Head>
      <Layout title="Transactions">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>
            {canEdit && (
              <Link href="/transactions/new" className="btn-primary flex items-center">
                <PlusIcon className="w-4 h-4 mr-2" />
                New Transaction
              </Link>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="card">
              <div className="card-body">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="label">Status</label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                      className="input"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="processed">Processed</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Per Page</label>
                    <select
                      value={filters.limit || 50}
                      onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                      className="input"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="card">
            <div className="overflow-hidden">
              {isLoading ? (
                <div className="p-6 text-center">Loading transactions...</div>
              ) : transactionsData?.data?.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No transactions found.
                </div>
              ) : (
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Transaction ID</th>
                      <th className="table-header-cell">Individual</th>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Amount</th>
                      <th className="table-header-cell">Effective Date</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactionsData?.data?.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        onStatusUpdate={handleStatusUpdate}
                        canEdit={canEdit}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {transactionsData?.pagination && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
                    disabled={(filters.page || 1) <= 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange((filters.page || 1) + 1)}
                    disabled={(filters.page || 1) >= transactionsData.pagination.totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {((filters.page || 1) - 1) * (filters.limit || 50) + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(
                          (filters.page || 1) * (filters.limit || 50),
                          transactionsData.pagination.total
                        )}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">
                        {transactionsData.pagination.total}
                      </span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
                        disabled={(filters.page || 1) <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Page {filters.page || 1} of {transactionsData.pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange((filters.page || 1) + 1)}
                        disabled={(filters.page || 1) >= transactionsData.pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}