import React from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useRequireAuth } from '@/context/AuthContext';
import { useDailySummary, useNACHAStats } from '@/hooks/api';
import { format } from 'date-fns';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ title, value, icon: Icon, subtitle, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`inline-flex items-center justify-center p-3 ${colorClasses[color]} rounded-md shadow-lg`}>
              <Icon className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {value}
              </dd>
              {subtitle && (
                <dd className="text-sm text-gray-500">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const auth = useRequireAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { data: dailySummary, isLoading: isDailySummaryLoading } = useDailySummary(today);
  const { data: nachaStats, isLoading: isNachaStatsLoading } = useNACHAStats(30);

  if (auth.isLoading || isDailySummaryLoading || isNachaStatsLoading) {
    return (
      <Layout title="Dashboard">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const summary = dailySummary?.data;
  const stats = nachaStats?.data;

  return (
    <>
      <Head>
        <title>Dashboard - ACH Processing System</title>
      </Head>
      <Layout title="Dashboard">
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Today's Transactions"
              value={summary?.totalTransactions || 0}
              icon={DocumentTextIcon}
              subtitle={`$${(summary?.totalAmount || 0).toLocaleString()}`}
              color="blue"
            />
            <StatCard
              title="Pending Transactions"
              value={summary?.pendingCount || 0}
              icon={ClockIcon}
              subtitle="Awaiting processing"
              color="yellow"
            />
            <StatCard
              title="Processed Today"
              value={summary?.processedCount || 0}
              icon={ChartBarIcon}
              subtitle="Successfully completed"
              color="green"
            />
            <StatCard
              title="Failed Today"
              value={summary?.failedCount || 0}
              icon={CurrencyDollarIcon}
              subtitle="Require attention"
              color="red"
            />
          </div>

          {/* Transaction Type Breakdown */}
          {summary && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">
                    Today's Transaction Breakdown
                  </h3>
                </div>
                <div className="card-body">
                  <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Debits</dt>
                      <dd className="mt-1 text-3xl font-semibold text-red-600">
                        {summary.debitCount}
                      </dd>
                      <dd className="text-sm text-gray-500">
                        ${summary.debitAmount.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Credits</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-600">
                        {summary.creditCount}
                      </dd>
                      <dd className="text-sm text-gray-500">
                        ${summary.creditAmount.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* NACHA Files Stats */}
              {stats && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">
                      NACHA Files (Last 30 Days)
                    </h3>
                  </div>
                  <div className="card-body">
                    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Files</dt>
                        <dd className="mt-1 text-3xl font-semibold text-blue-600">
                          {stats.totalFiles}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Records</dt>
                        <dd className="mt-1 text-3xl font-semibold text-blue-600">
                          {stats.totalRecords}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Debits</dt>
                        <dd className="mt-1 text-xl font-semibold text-red-600">
                          ${stats.totalDebits.toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Credits</dt>
                        <dd className="mt-1 text-xl font-semibold text-green-600">
                          ${stats.totalCredits.toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {auth.hasRole(['admin', 'operator']) && (
                  <>
                    <a
                      href="/transactions/new"
                      className="btn-primary text-center"
                    >
                      Create Transaction
                    </a>
                    <a
                      href="/nacha-files/generate"
                      className="btn-secondary text-center"
                    >
                      Generate NACHA File
                    </a>
                  </>
                )}
                <a
                  href="/transactions"
                  className="btn-secondary text-center"
                >
                  View Transactions
                </a>
                <a
                  href="/reports"
                  className="btn-secondary text-center"
                >
                  View Reports
                </a>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                System Status
              </h3>
            </div>
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    All systems operational
                  </p>
                  <p className="text-xs text-gray-400">
                    Last updated: {format(new Date(), 'PPpp')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}