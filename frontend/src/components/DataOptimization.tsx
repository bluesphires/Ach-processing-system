'use client';

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimeConfig } from '@/lib/query-client';
import { apiClient } from '@/lib/api';

/**
 * Optimized data prefetching component that implements React Query best practices
 * This component prefetches critical data to reduce loading times and server calls
 */
export function DataPrefetcher({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch critical user data that's likely to be needed
    const prefetchCriticalData = async () => {
      try {
        // Prefetch current user data if not already cached
        if (!queryClient.getQueryData(queryKeys.currentUser)) {
          queryClient.prefetchQuery({
            queryKey: queryKeys.currentUser,
            queryFn: async () => {
              const response = await apiClient.getProfile();
              return response.data;
            },
            staleTime: staleTimeConfig.normal,
          });
        }

        // Prefetch transaction stats (frequently viewed)
        queryClient.prefetchQuery({
          queryKey: queryKeys.transactionStats,
          queryFn: async () => {
            const response = await apiClient.getTransactionStats();
            return response.data;
          },
          staleTime: staleTimeConfig.frequent,
        });

        // Prefetch recent transactions (first page)
        queryClient.prefetchQuery({
          queryKey: queryKeys.transactionsList({ page: 1, limit: 20 }),
          queryFn: async () => {
            const response = await apiClient.getTransactions({ page: 1, limit: 20 });
            return response.data;
          },
          staleTime: staleTimeConfig.frequent,
        });

        // Prefetch system config (needed for admin features)
        queryClient.prefetchQuery({
          queryKey: queryKeys.allSystemConfig,
          queryFn: async () => {
            const response = await apiClient.getSystemConfig();
            return response.data;
          },
          staleTime: staleTimeConfig.stable,
        });

        // Prefetch current year holidays
        const currentYear = new Date().getFullYear();
        queryClient.prefetchQuery({
          queryKey: queryKeys.holidaysList(currentYear),
          queryFn: async () => {
            const response = await apiClient.getFederalHolidays(currentYear);
            return response.data;
          },
          staleTime: staleTimeConfig.static,
        });

      } catch (error) {
        // Silent fail for prefetching - don't block app startup
        console.debug('Prefetch error (non-critical):', error);
      }
    };

    // Delay prefetch slightly to not interfere with critical app startup
    const timer = setTimeout(prefetchCriticalData, 100);
    
    return () => clearTimeout(timer);
  }, [queryClient]);

  return <>{children}</>;
}

/**
 * Background refresh component that keeps data fresh without user interaction
 */
export function BackgroundRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up interval to refresh critical data in background
    const refreshInterval = setInterval(() => {
      // Only refresh if user is active (has focus)
      if (document.hasFocus()) {
        // Refresh transaction stats (most dynamic data)
        queryClient.invalidateQueries({
          queryKey: queryKeys.transactionStats,
          refetchType: 'none', // Don't refetch immediately, just mark as stale
        });

        // Refresh recent transactions
        queryClient.invalidateQueries({
          queryKey: queryKeys.transactionsList({ page: 1 }),
          refetchType: 'none',
        });
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    // Set up longer interval for less critical data
    const slowRefreshInterval = setInterval(() => {
      if (document.hasFocus()) {
        // Refresh NACHA files list
        queryClient.invalidateQueries({
          queryKey: queryKeys.nachaFiles,
          refetchType: 'none',
        });
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => {
      clearInterval(refreshInterval);
      clearInterval(slowRefreshInterval);
    };
  }, [queryClient]);

  return null;
}

/**
 * Smart pagination component that prefetches adjacent pages
 */
interface SmartPaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  prefetchFn: (page: number) => void;
}

export function SmartPagination({ 
  currentPage, 
  onPageChange, 
  totalPages, 
  prefetchFn 
}: SmartPaginationProps) {
  useEffect(() => {
    // Prefetch next and previous pages
    const pagesToPrefetch: number[] = [];
    
    if (currentPage > 1) {
      pagesToPrefetch.push(currentPage - 1);
    }
    
    if (currentPage < totalPages) {
      pagesToPrefetch.push(currentPage + 1);
    }

    // Prefetch with slight delay to not interfere with current page loading
    const timer = setTimeout(() => {
      pagesToPrefetch.forEach(page => {
        prefetchFn(page);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPage, totalPages, prefetchFn]);

  const handlePageChange = (page: number) => {
    // Immediately start loading the new page
    onPageChange(page);
    
    // Prefetch adjacent pages for this new page
    setTimeout(() => {
      if (page > 1) prefetchFn(page - 1);
      if (page < totalPages) prefetchFn(page + 1);
    }, 100);
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (page > totalPages) return null;
              
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? 'bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}