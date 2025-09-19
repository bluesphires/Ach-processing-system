'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';
import { CreateSeparateTransactionRequest } from '@/types';
import toast from 'react-hot-toast';

export default function NewTransactionPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateSeparateTransactionRequest>({
    drRoutingNumber: '',
    drAccountNumber: '',
    drId: '',
    drName: '',
    drEffectiveDate: '',
    crRoutingNumber: '',
    crAccountNumber: '',
    crId: '',
    crName: '',
    crEffectiveDate: '',
    amount: 0,
    senderDetails: ''
  });

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiClient.createSeparateTransaction(formData);
      
      if (response.success) {
        toast.success('Transaction created successfully with separate debit and credit entries!');
        router.push('/dashboard/transactions/groups');
      } else {
        toast.error(response.error || 'Failed to create transaction');
      }
    } catch (error) {
      console.error('Create transaction error:', error);
      toast.error('Failed to create transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Transaction</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new ACH transaction with separate debit and credit effective dates.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Debit Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Debit Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="drRoutingNumber" className="block text-sm font-medium text-gray-700">
                    Debit Routing Number
                  </label>
                  <input
                    type="text"
                    id="drRoutingNumber"
                    name="drRoutingNumber"
                    value={formData.drRoutingNumber}
                    onChange={handleInputChange}
                    pattern="[0-9]{9}"
                    maxLength={9}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <label htmlFor="drAccountNumber" className="block text-sm font-medium text-gray-700">
                    Debit Account Number
                  </label>
                  <input
                    type="text"
                    id="drAccountNumber"
                    name="drAccountNumber"
                    value={formData.drAccountNumber}
                    onChange={handleInputChange}
                    maxLength={17}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label htmlFor="drId" className="block text-sm font-medium text-gray-700">
                    Debit Account ID
                  </label>
                  <input
                    type="text"
                    id="drId"
                    name="drId"
                    value={formData.drId}
                    onChange={handleInputChange}
                    maxLength={15}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="ACCT123"
                  />
                </div>
                <div>
                  <label htmlFor="drName" className="block text-sm font-medium text-gray-700">
                    Debit Account Name
                  </label>
                  <input
                    type="text"
                    id="drName"
                    name="drName"
                    value={formData.drName}
                    onChange={handleInputChange}
                    maxLength={22}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="drEffectiveDate" className="block text-sm font-medium text-gray-700">
                    Debit Effective Date
                  </label>
                  <input
                    type="date"
                    id="drEffectiveDate"
                    name="drEffectiveDate"
                    value={formData.drEffectiveDate}
                    onChange={handleInputChange}
                    min={getTomorrowDate()}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Credit Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Credit Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="crRoutingNumber" className="block text-sm font-medium text-gray-700">
                    Credit Routing Number
                  </label>
                  <input
                    type="text"
                    id="crRoutingNumber"
                    name="crRoutingNumber"
                    value={formData.crRoutingNumber}
                    onChange={handleInputChange}
                    pattern="[0-9]{9}"
                    maxLength={9}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="987654321"
                  />
                </div>
                <div>
                  <label htmlFor="crAccountNumber" className="block text-sm font-medium text-gray-700">
                    Credit Account Number
                  </label>
                  <input
                    type="text"
                    id="crAccountNumber"
                    name="crAccountNumber"
                    value={formData.crAccountNumber}
                    onChange={handleInputChange}
                    maxLength={17}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="0987654321"
                  />
                </div>
                <div>
                  <label htmlFor="crId" className="block text-sm font-medium text-gray-700">
                    Credit Account ID
                  </label>
                  <input
                    type="text"
                    id="crId"
                    name="crId"
                    value={formData.crId}
                    onChange={handleInputChange}
                    maxLength={15}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="ACCT456"
                  />
                </div>
                <div>
                  <label htmlFor="crName" className="block text-sm font-medium text-gray-700">
                    Credit Account Name
                  </label>
                  <input
                    type="text"
                    id="crName"
                    name="crName"
                    value={formData.crName}
                    onChange={handleInputChange}
                    maxLength={22}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label htmlFor="crEffectiveDate" className="block text-sm font-medium text-gray-700">
                    Credit Effective Date
                  </label>
                  <input
                    type="date"
                    id="crEffectiveDate"
                    name="crEffectiveDate"
                    value={formData.crEffectiveDate}
                    onChange={handleInputChange}
                    min={getTomorrowDate()}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount || ''}
                    onChange={handleInputChange}
                    min="0.01"
                    step="0.01"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="100.00"
                  />
                </div>
                <div>
                  <label htmlFor="senderDetails" className="block text-sm font-medium text-gray-700">
                    Sender Details (Optional)
                  </label>
                  <input
                    type="text"
                    id="senderDetails"
                    name="senderDetails"
                    value={formData.senderDetails}
                    onChange={handleInputChange}
                    maxLength={255}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Payment description"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}