import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys, staleTimeConfig } from '@/lib/query-client';
import { NACHAFile } from '@/types';
import { toast } from 'react-hot-toast';

// NACHA File Queries
export function useNACHAFiles(params?: {
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.nachaFilesList(params),
    queryFn: async () => {
      const response = await apiClient.getNACHAFiles(params);
      return response.data;
    },
    staleTime: staleTimeConfig.normal, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

export function useNACHAFile(id: string) {
  return useQuery({
    queryKey: queryKeys.nachaFileDetail(id),
    queryFn: async () => {
      const response = await apiClient.getNACHAFile(id);
      return response.data;
    },
    staleTime: staleTimeConfig.stable, // 15 minutes - NACHA files don't change often
    enabled: !!id,
  });
}

export function useNACHAFileValidation(id: string) {
  return useQuery({
    queryKey: queryKeys.nachaFileValidation(id),
    queryFn: async () => {
      const response = await apiClient.validateNACHAFile(id);
      return response.data;
    },
    staleTime: staleTimeConfig.stable, // 15 minutes - validation results are stable
    enabled: !!id,
    // Don't automatically refetch validation results
    refetchOnWindowFocus: false,
  });
}

// NACHA File Mutations
export function useGenerateNACHAFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { effectiveDate: string; fileType: 'DR' | 'CR' }) => {
      const response = await apiClient.generateNACHAFile(data);
      if (!response.data) {
        throw new Error('Failed to generate NACHA file');
      }
      return response.data;
    },
    onSuccess: (newNACHAFile: NACHAFile) => {
      // Invalidate NACHA files list to include new file
      queryClient.invalidateQueries({ queryKey: queryKeys.nachaFiles });
      
      // Add new file to cache optimistically
      queryClient.setQueryData<NACHAFile[]>(
        queryKeys.nachaFilesList(),
        (oldData) => {
          if (oldData) {
            return [newNACHAFile, ...oldData];
          }
          return oldData;
        }
      );
      
      // Cache the new file details
      queryClient.setQueryData(
        queryKeys.nachaFileDetail(newNACHAFile.id),
        newNACHAFile
      );
      
      // Invalidate transaction-related queries as they may have been processed
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      
      toast.success(`NACHA file ${newNACHAFile.filename} generated successfully`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to generate NACHA file';
      toast.error(message);
    },
  });
}

export function useMarkNACHAFileTransmitted() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.markNACHAFileTransmitted(id);
      if (!response.success) {
        throw new Error('Failed to mark NACHA file as transmitted');
      }
      // Refetch the updated file
      const fileResponse = await apiClient.getNACHAFile(id);
      if (!fileResponse.data) {
        throw new Error('Failed to fetch updated NACHA file');
      }
      return fileResponse.data;
    },
    onSuccess: (updatedFile: NACHAFile, fileId: string) => {
      // Update file in cache
      queryClient.setQueryData(
        queryKeys.nachaFileDetail(fileId),
        updatedFile
      );
      
      // Update file in lists cache
      queryClient.setQueriesData<NACHAFile[]>(
        { queryKey: queryKeys.nachaFiles },
        (oldData) => {
          if (oldData) {
            return oldData.map(file => 
              file.id === fileId ? updatedFile : file
            );
          }
          return oldData;
        }
      );
      
      toast.success('NACHA file marked as transmitted');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to mark file as transmitted';
      toast.error(message);
    },
  });
}

export function useDownloadNACHAFile() {
  return useMutation({
    mutationFn: async (id: string) => {
      // Create a download link and trigger download
      const response = await fetch(`${apiClient['client'].defaults.baseURL}/api/nacha/files/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${apiClient['token']}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `nacha-file-${id}.txt`;
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { filename };
    },
    onSuccess: (data) => {
      toast.success(`Downloaded ${data.filename}`);
    },
    onError: (error: any) => {
      const message = error?.message || 'Download failed';
      toast.error(message);
    },
  });
}

// Validation mutations
export function useValidateNACHAFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.validateNACHAFile(id);
      if (!response.data) {
        throw new Error('Failed to validate NACHA file');
      }
      return response.data;
    },
    onSuccess: (validationResult, fileId) => {
      // Cache validation result
      queryClient.setQueryData(
        queryKeys.nachaFileValidation(fileId),
        validationResult
      );
      
      const status = validationResult.isValid ? 'valid' : 'invalid';
      toast.success(`File validation completed - ${status}`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Validation failed';
      toast.error(message);
    },
  });
}

// Prefetch helper for NACHA file operations
export function usePrefetchNACHAFiles() {
  const queryClient = useQueryClient();
  
  return (params?: { page: number; limit?: number }) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.nachaFilesList(params),
      queryFn: async () => {
        const response = await apiClient.getNACHAFiles(params);
        return response.data;
      },
      staleTime: staleTimeConfig.normal,
    });
  };
}

// Helper to invalidate all NACHA-related queries
export function useInvalidateNACHAData() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.nachaFiles });
  };
}