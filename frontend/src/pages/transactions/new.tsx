import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { useRequireAuth } from '@/context/AuthContext';
import { useCreateTransaction } from '@/hooks/api';
import { CreateTransactionRequest } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewTransactionPage() {
  const auth = useRequireAuth(['admin', 'operator']);
  const router = useRouter();
  const createTransactionMutation = useCreateTransaction();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateTransactionRequest>();

  const transactionType = watch('transactionType');

  const onSubmit = async (data: CreateTransactionRequest) => {
    try {
      await createTransactionMutation.mutateAsync(data);
      toast.success('Transaction created successfully');
      router.push('/transactions');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create transaction';
      toast.error(message);
    }
  };

  if (auth.isLoading) {
    return <Layout title="New Transaction"><div>Loading...</div></Layout>;
  }

  return (
    <>
      <Head>
        <title>New Transaction - ACH Processing System</title>
      </Head>
      <Layout title="New Transaction">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center">
            <Link
              href="/transactions"
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Back to Transactions
            </Link>
          </div>

          {/* Form */}
          <div className="card max-w-4xl">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Create New ACH Transaction
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Transaction Details */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="label">Transaction ID</label>
                    <input
                      {...register('transactionId', {
                        required: 'Transaction ID is required',
                      })}
                      type="text"
                      className={errors.transactionId ? 'input-error' : 'input'}
                      placeholder="TXN-001"
                    />
                    {errors.transactionId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.transactionId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">Transaction Type</label>
                    <select
                      {...register('transactionType', {
                        required: 'Transaction type is required',
                      })}
                      className={errors.transactionType ? 'input-error' : 'input'}
                    >
                      <option value="">Select Type</option>
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                    {errors.transactionType && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.transactionType.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">Amount</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        {...register('amount', {
                          required: 'Amount is required',
                          valueAsNumber: true,
                          min: { value: 0.01, message: 'Amount must be greater than 0' },
                        })}
                        type="number"
                        step="0.01"
                        min="0.01"
                        className={`pl-7 ${errors.amount ? 'input-error' : 'input'}`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">Effective Date</label>
                    <input
                      {...register('effectiveDate', {
                        required: 'Effective date is required',
                      })}
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className={errors.effectiveDate ? 'input-error' : 'input'}
                    />
                    {errors.effectiveDate && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.effectiveDate.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Bank Account Details
                  </h4>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="label">Routing Number</label>
                      <input
                        {...register('routingNumber', {
                          required: 'Routing number is required',
                          pattern: {
                            value: /^\d{9}$/,
                            message: 'Routing number must be 9 digits',
                          },
                        })}
                        type="text"
                        maxLength={9}
                        className={errors.routingNumber ? 'input-error' : 'input'}
                        placeholder="123456789"
                      />
                      {errors.routingNumber && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.routingNumber.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="label">Account Number</label>
                      <input
                        {...register('accountNumber', {
                          required: 'Account number is required',
                          minLength: {
                            value: 1,
                            message: 'Account number is required',
                          },
                          maxLength: {
                            value: 17,
                            message: 'Account number cannot exceed 17 characters',
                          },
                        })}
                        type="text"
                        maxLength={17}
                        className={errors.accountNumber ? 'input-error' : 'input'}
                        placeholder="1234567890"
                      />
                      {errors.accountNumber && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.accountNumber.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="label">Account Type</label>
                      <select
                        {...register('accountType', {
                          required: 'Account type is required',
                        })}
                        className={errors.accountType ? 'input-error' : 'input'}
                      >
                        <option value="">Select Type</option>
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                      {errors.accountType && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.accountType.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Individual Details */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Individual Details
                  </h4>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="label">Individual Name</label>
                      <input
                        {...register('individualName', {
                          required: 'Individual name is required',
                          maxLength: {
                            value: 22,
                            message: 'Name cannot exceed 22 characters',
                          },
                        })}
                        type="text"
                        maxLength={22}
                        className={errors.individualName ? 'input-error' : 'input'}
                        placeholder="John Doe"
                      />
                      {errors.individualName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.individualName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="label">Individual ID</label>
                      <input
                        {...register('individualId', {
                          required: 'Individual ID is required',
                          maxLength: {
                            value: 15,
                            message: 'ID cannot exceed 15 characters',
                          },
                        })}
                        type="text"
                        maxLength={15}
                        className={errors.individualId ? 'input-error' : 'input'}
                        placeholder="ID123456"
                      />
                      {errors.individualId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.individualId.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="label">Company Name (Optional)</label>
                      <input
                        {...register('companyName', {
                          maxLength: {
                            value: 50,
                            message: 'Company name cannot exceed 50 characters',
                          },
                        })}
                        type="text"
                        maxLength={50}
                        className={errors.companyName ? 'input-error' : 'input'}
                        placeholder="Company Inc."
                      />
                      {errors.companyName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.companyName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="label">Company ID (Optional)</label>
                      <input
                        {...register('companyId', {
                          maxLength: {
                            value: 10,
                            message: 'Company ID cannot exceed 10 characters',
                          },
                        })}
                        type="text"
                        maxLength={10}
                        className={errors.companyId ? 'input-error' : 'input'}
                        placeholder="COMP123"
                      />
                      {errors.companyId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.companyId.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t border-gray-200 pt-6">
                  <div>
                    <label className="label">Description</label>
                    <textarea
                      {...register('description', {
                        required: 'Description is required',
                        maxLength: {
                          value: 100,
                          message: 'Description cannot exceed 100 characters',
                        },
                      })}
                      rows={3}
                      maxLength={100}
                      className={errors.description ? 'input-error' : 'input'}
                      placeholder="Payment for services..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Transaction Type Info */}
                {transactionType && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">
                          {transactionType === 'debit' ? 'Debit Transaction' : 'Credit Transaction'}
                        </h4>
                        <p className="text-sm text-blue-700">
                          {transactionType === 'debit'
                            ? 'This will withdraw money from the specified account.'
                            : 'This will deposit money into the specified account.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Link href="/transactions" className="btn-secondary">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={createTransactionMutation.isLoading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {createTransactionMutation.isLoading
                      ? 'Creating...'
                      : 'Create Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}