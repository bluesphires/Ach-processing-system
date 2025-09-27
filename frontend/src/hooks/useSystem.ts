import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys, staleTimeConfig } from '@/lib/query-client';
import { SystemConfig, FederalHoliday } from '@/types';
import { toast } from 'react-hot-toast';

// System Configuration Queries
export function useSystemConfig() {
  return useQuery({
    queryKey: queryKeys.allSystemConfig,
    queryFn: async () => {
      const response = await apiClient.getSystemConfig();
      return response.data;
    },
    staleTime: staleTimeConfig.stable, // 15 minutes - config doesn't change often
    refetchOnWindowFocus: false,
  });
}

export function useSystemConfigByKey(key: string) {
  return useQuery({
    queryKey: queryKeys.specificConfig(key),
    queryFn: async () => {
      const response = await apiClient.getSystemConfigByKey(key);
      return response.data;
    },
    staleTime: staleTimeConfig.stable,
    enabled: !!key,
    refetchOnWindowFocus: false,
  });
}

// Federal Holidays Queries
export function useFederalHolidays(year?: number) {
  return useQuery({
    queryKey: queryKeys.holidaysList(year),
    queryFn: async () => {
      const response = await apiClient.getFederalHolidays(year);
      return response.data;
    },
    staleTime: staleTimeConfig.static, // 1 hour - holidays are very stable
    refetchOnWindowFocus: false,
  });
}

// Business Day Queries
export function useBusinessDayCheck(date: string) {
  return useQuery({
    queryKey: queryKeys.businessDayCheck(date),
    queryFn: async () => {
      const response = await apiClient.checkBusinessDay(date);
      return response.data;
    },
    staleTime: staleTimeConfig.static, // 1 hour - business day status doesn't change
    enabled: !!date,
    refetchOnWindowFocus: false,
  });
}

export function useNextBusinessDay(date: string) {
  return useQuery({
    queryKey: queryKeys.nextBusinessDay(date),
    queryFn: async () => {
      const response = await apiClient.getNextBusinessDay(date);
      return response.data;
    },
    staleTime: staleTimeConfig.static,
    enabled: !!date,
    refetchOnWindowFocus: false,
  });
}

// System Configuration Mutations
export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      const response = await apiClient.setSystemConfig(key, value, description);
      if (!response.data) {
        throw new Error('Failed to update system config');
      }
      return response.data;
    },
    onSuccess: (updatedConfig: SystemConfig, variables) => {
      // Update specific config in cache
      queryClient.setQueryData(
        queryKeys.specificConfig(variables.key),
        updatedConfig
      );
      
      // Invalidate all system config to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig });
      
      toast.success(`Configuration '${variables.key}' updated successfully`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to update configuration';
      toast.error(message);
    },
  });
}

export function useUpdateSFTPSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiClient.setSFTPSettings(settings);
      if (!response.success) {
        throw new Error('Failed to update SFTP settings');
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate SFTP-related configs
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.systemConfig,
        predicate: (query) => {
          const key = query.queryKey[query.queryKey.length - 1];
          return typeof key === 'string' && key.startsWith('sftp_');
        }
      });
      
      toast.success('SFTP settings updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to update SFTP settings';
      toast.error(message);
    },
  });
}

export function useUpdateACHSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiClient.setACHSettings(settings);
      if (!response.success) {
        throw new Error('Failed to update ACH settings');
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate ACH-related configs
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.systemConfig,
        predicate: (query) => {
          const key = query.queryKey[query.queryKey.length - 1];
          return typeof key === 'string' && key.startsWith('ach_');
        }
      });
      
      toast.success('ACH settings updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to update ACH settings';
      toast.error(message);
    },
  });
}

// Federal Holidays Mutations
export function useCreateFederalHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (holiday: Omit<FederalHoliday, 'id'>) => {
      const response = await apiClient.createFederalHoliday(holiday);
      if (!response.data) {
        throw new Error('Failed to create federal holiday');
      }
      return response.data;
    },
    onSuccess: (newHoliday: FederalHoliday) => {
      // Invalidate holidays list for the year
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.holidays,
      });
      
      // Also invalidate business day calculations as they depend on holidays
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessDays,
      });
      
      toast.success(`Holiday '${newHoliday.name}' created successfully`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to create holiday';
      toast.error(message);
    },
  });
}

export function useUpdateFederalHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FederalHoliday> }) => {
      const response = await apiClient.updateFederalHoliday(id, updates);
      if (!response.success) {
        throw new Error('Failed to update federal holiday');
      }
      // Refetch the updated holiday
      const holidayResponse = await apiClient.getFederalHolidays();
      if (!holidayResponse.data) {
        throw new Error('Failed to fetch updated holidays');
      }
      const updatedHoliday = holidayResponse.data.find(h => h.id === id);
      if (!updatedHoliday) {
        throw new Error('Updated holiday not found');
      }
      return updatedHoliday;
    },
    onSuccess: (updatedHoliday: FederalHoliday) => {
      // Invalidate holidays list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.holidays,
      });
      
      // Invalidate business day calculations
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessDays,
      });
      
      toast.success(`Holiday '${updatedHoliday.name}' updated successfully`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to update holiday';
      toast.error(message);
    },
  });
}

export function useDeleteFederalHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteFederalHoliday(id);
      return id;
    },
    onSuccess: (deletedId: string) => {
      // Remove from holidays lists cache
      queryClient.setQueriesData<FederalHoliday[]>(
        { queryKey: queryKeys.holidays },
        (oldData) => {
          if (oldData) {
            return oldData.filter(holiday => holiday.id !== deletedId);
          }
          return oldData;
        }
      );
      
      // Invalidate business day calculations
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessDays,
      });
      
      toast.success('Holiday deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to delete holiday';
      toast.error(message);
    },
  });
}

export function useGenerateDefaultHolidays() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (year: number) => {
      const response = await apiClient.generateDefaultHolidays(year);
      if (!response.data) {
        throw new Error('Failed to generate default holidays');
      }
      return response.data;
    },
    onSuccess: (holidays: FederalHoliday[], year: number) => {
      // Invalidate holidays for the year
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.holidaysList(year),
      });
      
      // Invalidate business day calculations
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessDays,
      });
      
      toast.success(`Generated ${holidays.length} default holidays for ${year}`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to generate default holidays';
      toast.error(message);
    },
  });
}

// SFTP Test Connection
export function useTestSFTPConnection() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.testSFTPConnection();
      if (!response.data) {
        throw new Error('Failed to test SFTP connection');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('SFTP connection test successful');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'SFTP connection test failed';
      toast.error(message);
    },
  });
}