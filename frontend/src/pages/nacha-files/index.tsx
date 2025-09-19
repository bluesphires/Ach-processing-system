import React from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useRequireAuth } from '@/context/AuthContext';
import { useNACHAFiles, useGenerateNACHAFile, useDownloadNACHAFile } from '@/hooks/api';
import { format } from 'date-fns';
import { ArrowDownTrayIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const statusColors = {
  generated: 'bg-blue-100 text-blue-800',
  transmitted: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function NACHAFilesPage() {
  const auth = useRequireAuth();
  const { data: filesData, isLoading, refetch } = useNACHAFiles();
  const generateFileMutation = useGenerateNACHAFile();
  const downloadMutation = useDownloadNACHAFile();

  const canGenerate = auth.hasRole(['admin', 'operator']);

  const handleGenerateFile = async () => {
    const effectiveDate = prompt('Enter effective date (YYYY-MM-DD):');
    if (!effectiveDate) return;

    try {
      await generateFileMutation.mutateAsync(effectiveDate);
      toast.success('NACHA file generated successfully');
      refetch();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to generate NACHA file';
      toast.error(message);
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      await downloadMutation.mutateAsync({ id, filename });
      toast.success('File downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to download file');
    }
  };

  if (auth.isLoading) {
    return <Layout title="NACHA Files"><div>Loading...</div></Layout>;
  }

  return (
    <>
      <Head>
        <title>NACHA Files - ACH Processing System</title>
      </Head>
      <Layout title="NACHA Files">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Generated NACHA files for ACH processing
            </p>
            {canGenerate && (
              <button
                onClick={handleGenerateFile}
                disabled={generateFileMutation.isLoading}
                className="btn-primary flex items-center"
              >
                <DocumentPlusIcon className="w-4 h-4 mr-2" />
                {generateFileMutation.isLoading ? 'Generating...' : 'Generate File'}
              </button>
            )}
          </div>

          {/* Files Table */}
          <div className="card">
            <div className="overflow-hidden">
              {isLoading ? (
                <div className="p-6 text-center">Loading NACHA files...</div>
              ) : filesData?.data?.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No NACHA files found.
                </div>
              ) : (
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Filename</th>
                      <th className="table-header-cell">Effective Date</th>
                      <th className="table-header-cell">Records</th>
                      <th className="table-header-cell">Total Debits</th>
                      <th className="table-header-cell">Total Credits</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Generated</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filesData?.data?.map((file) => (
                      <tr key={file.id} className="table-row">
                        <td className="table-cell">
                          <div className="text-sm font-medium text-gray-900">
                            {file.filename}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">
                            {format(new Date(file.effectiveDate), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">
                            {file.totalRecords}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-red-600 font-medium">
                            ${file.totalDebits.toLocaleString()}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-green-600 font-medium">
                            ${file.totalCredits.toLocaleString()}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[file.status]}`}>
                            {file.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">
                            {format(new Date(file.generatedAt), 'MMM d, yyyy HH:mm')}
                          </div>
                        </td>
                        <td className="table-cell">
                          <button
                            onClick={() => handleDownload(file.id, file.filename)}
                            disabled={downloadMutation.isLoading}
                            className="text-primary-600 hover:text-primary-900 text-sm font-medium flex items-center"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}