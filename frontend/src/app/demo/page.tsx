'use client';

import { useState } from 'react';
import { CreateSeparateTransactionRequest } from '@/types';

export default function DemoTransactionPage() {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Demo: Transaction creation form submitted with separate debit and credit effective dates!');
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ACH Processing System - Demo</h1>
          <p className="mt-2 text-lg text-gray-600">
            Create New Transaction with Separate Debit and Credit Effective Dates
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              <strong>New Feature:</strong> This form now supports separate effective dates for debit and credit entries, 
              allowing for more flexible ACH processing workflows where debits and credits can be processed on different business days.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow-lg rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-8 p-8">
            {/* Debit Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Debit Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="drRoutingNumber" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <label htmlFor="drAccountNumber" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label htmlFor="drId" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="ACCT123"
                  />
                </div>
                <div>
                  <label htmlFor="drName" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="John Doe"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="drEffectiveDate" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                  />
                  <p className="mt-1 text-sm text-gray-500">Date when the debit will be processed</p>
                </div>
              </div>
            </div>

            {/* Credit Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Credit Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="crRoutingNumber" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="987654321"
                  />
                </div>
                <div>
                  <label htmlFor="crAccountNumber" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="0987654321"
                  />
                </div>
                <div>
                  <label htmlFor="crId" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="ACCT456"
                  />
                </div>
                <div>
                  <label htmlFor="crName" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="crEffectiveDate" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                  />
                  <p className="mt-1 text-sm text-gray-500">Date when the credit will be processed (can be different from debit date)</p>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Transaction Details
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="1500.00"
                  />
                </div>
                <div>
                  <label htmlFor="senderDetails" className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Details (Optional)
                  </label>
                  <input
                    type="text"
                    id="senderDetails"
                    name="senderDetails"
                    value={formData.senderDetails}
                    onChange={handleInputChange}
                    maxLength={255}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                    placeholder="Payment description"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Create Transaction with Separate Dates
              </button>
            </div>
          </form>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Separate Effective Dates</h4>
            <p className="text-gray-600">Debit and credit entries can have different effective dates for flexible processing schedules.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Individual Entry Tracking</h4>
            <p className="text-gray-600">Each debit and credit is stored separately allowing for independent status tracking and processing.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">NACHA Compliance</h4>
            <p className="text-gray-600">Enhanced NACHA file generation processes entries by effective date and type for compliance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}