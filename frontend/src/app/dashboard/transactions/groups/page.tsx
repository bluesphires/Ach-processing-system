'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';
import { TransactionGroup } from '@/types';
import toast from 'react-hot-toast';

export default function TransactionGroupsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Early return for authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const [groups, setGroups] = useState<TransactionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadTransactionGroups = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await apiClient.getTransactionGroups({ page, limit: 20 });
      
      if (response.success && response.data) {
        setGroups(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setCurrentPage(response.pagination.page);
        }
      } else {
        toast.error('Failed to load transaction groups');
      }
    } catch (error) {
      console.error('Load transaction groups error:', error);
      toast.error('Failed to load transaction groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadTransactionGroups();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">Transaction Groups</h1>
            <p className="mt-1 text-sm text-gray-500">
              View linked debit and credit transaction pairs with their separate effective dates.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => router.push('/dashboard/transactions/new')}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              Create New Transaction
            </button>
          </div>
        </div>

        {/* Transaction Groups */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading transaction groups...</p>
            </div>
          ) : (
            <>
              <div className="space-y-6 p-6">
                {groups.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No transaction groups found.</p>
                    <button
                      onClick={() => router.push('/dashboard/transactions/new')}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Create Your First Transaction
                    </button>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Group Header */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900">
                            Transaction Group: {group.id.split('-')[0]}...
                          </h3>
                          <div className="text-sm text-gray-500">
                            Created: {formatDate(group.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Debit and Credit Entries */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                        {/* Debit Entry */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                DEBIT
                              </span>
                              {group.drEntry && (
                                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(group.drEntry.status)}`}>
                                  {group.drEntry.status}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {group.drEntry ? (
                            <div className="space-y-2">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{group.drEntry.accountName}</div>
                                <div className="text-sm text-gray-500">
                                  {group.drEntry.routingNumber} | {group.drEntry.accountNumber}
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Amount:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(group.drEntry.amount)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Effective Date:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDate(group.drEntry.effectiveDate)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Debit entry not found</div>
                          )}
                        </div>

                        {/* Credit Entry */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                CREDIT
                              </span>
                              {group.crEntry && (
                                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(group.crEntry.status)}`}>
                                  {group.crEntry.status}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {group.crEntry ? (
                            <div className="space-y-2">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{group.crEntry.accountName}</div>
                                <div className="text-sm text-gray-500">
                                  {group.crEntry.routingNumber} | {group.crEntry.accountNumber}
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Amount:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(group.crEntry.amount)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Effective Date:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDate(group.crEntry.effectiveDate)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Credit entry not found</div>
                          )}
                        </div>
                      </div>

                      {/* Additional Info */}
                      {group.senderDetails && (
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Details:</span>
                            <span className="ml-2 text-gray-600">{group.senderDetails}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => currentPage > 1 && loadTransactionGroups(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => currentPage < totalPages && loadTransactionGroups(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => currentPage > 1 && loadTransactionGroups(currentPage - 1)}
                          disabled={currentPage <= 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => currentPage < totalPages && loadTransactionGroups(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}