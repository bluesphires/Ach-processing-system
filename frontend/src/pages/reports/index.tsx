import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useRequireAuth } from '@/context/AuthContext';
import { useDailySummary, useMonthlySummary, useTransactionStats } from '@/hooks/api';
import { format, subDays } from 'date-fns';

export default function ReportsPage() {
  const auth = useRequireAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: dailySummary, isLoading: isDailyLoading } = useDailySummary(selectedDate);
  const { data: monthlySummary, isLoading: isMonthlyLoading } = useMonthlySummary(selectedYear, selectedMonth);

  if (auth.isLoading) {
    return <Layout title="Reports"><div>Loading...</div></Layout>;
  }

  return (
    <>
      <Head>
        <title>Reports - ACH Processing System</title>
      </Head>
      <Layout title="Reports">
        <div className="space-y-6">
          {/* Daily Summary */}
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Daily Summary</h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input w-auto"
                />
              </div>
            </div>
            <div className="card-body">
              {isDailyLoading ? (
                <div>Loading daily summary...</div>
              ) : dailySummary?.data ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <dt className="text-sm font-medium text-blue-600">Total Transactions</dt>
                    <dd className="mt-1 text-3xl font-semibold text-blue-900">
                      {dailySummary.data.totalTransactions}
                    </dd>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <dt className="text-sm font-medium text-green-600">Total Amount</dt>
                    <dd className="mt-1 text-3xl font-semibold text-green-900">
                      ${dailySummary.data.totalAmount.toLocaleString()}
                    </dd>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <dt className="text-sm font-medium text-yellow-600">Pending</dt>
                    <dd className="mt-1 text-3xl font-semibold text-yellow-900">
                      {dailySummary.data.pendingCount}
                    </dd>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <dt className="text-sm font-medium text-red-600">Failed</dt>
                    <dd className="mt-1 text-3xl font-semibold text-red-900">
                      {dailySummary.data.failedCount}
                    </dd>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No data available for selected date</div>
              )}
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Monthly Summary</h3>
                <div className="flex space-x-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="input w-auto"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {format(new Date(2024, i, 1), 'MMMM')}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="input w-auto"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body">
              {isMonthlyLoading ? (
                <div>Loading monthly summary...</div>
              ) : monthlySummary?.data ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <dt className="text-sm font-medium text-blue-600">Total Transactions</dt>
                    <dd className="mt-1 text-3xl font-semibold text-blue-900">
                      {monthlySummary.data.totalTransactions}
                    </dd>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <dt className="text-sm font-medium text-green-600">Total Amount</dt>
                    <dd className="mt-1 text-3xl font-semibold text-green-900">
                      ${monthlySummary.data.totalAmount.toLocaleString()}
                    </dd>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <dt className="text-sm font-medium text-purple-600">NACHA Files</dt>
                    <dd className="mt-1 text-3xl font-semibold text-purple-900">
                      {monthlySummary.data.nachaFilesGenerated}
                    </dd>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No data available for selected month</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Export Reports</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <button className="btn-secondary">
                  Export Daily Transactions
                </button>
                <button className="btn-secondary">
                  Export Monthly Report
                </button>
                <button className="btn-secondary">
                  Export NACHA Files
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}