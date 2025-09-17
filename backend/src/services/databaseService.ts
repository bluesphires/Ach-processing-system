import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  ACHTransaction, 
  EncryptedTransaction, 
  NACHAFile, 
  FederalHoliday, 
  SystemConfig, 
  User,
  PaginatedResponse
} from '@/types';

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ACH Transactions
  async createTransaction(transaction: EncryptedTransaction): Promise<EncryptedTransaction> {
    const { data, error } = await this.supabase
      .from('ach_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return data;
  }

  async getTransaction(id: string): Promise<EncryptedTransaction | null> {
    const { data, error } = await this.supabase
      .from('ach_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get transaction: ${error.message}`);
    }

    return data;
  }

  async getTransactions(
    page: number = 1, 
    limit: number = 50,
    filters?: { status?: string; effectiveDate?: Date }
  ): Promise<PaginatedResponse<EncryptedTransaction>> {
    let query = this.supabase
      .from('ach_transactions')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.effectiveDate) {
      query = query.eq('effectiveDate', filters.effectiveDate.toISOString());
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    };
  }

  async updateTransactionStatus(id: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('ach_transactions')
      .update({ status, updatedAt: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update transaction status: ${error.message}`);
    }
  }

  // NACHA Files
  async createNACHAFile(nachaFile: Omit<NACHAFile, 'id' | 'createdAt'>): Promise<NACHAFile> {
    const fileData = {
      ...nachaFile,
      createdAt: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('nacha_files')
      .insert([fileData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create NACHA file: ${error.message}`);
    }

    return data;
  }

  async getNACHAFile(id: string): Promise<NACHAFile | null> {
    const { data, error } = await this.supabase
      .from('nacha_files')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get NACHA file: ${error.message}`);
    }

    return data;
  }

  async getNACHAFiles(page: number = 1, limit: number = 50): Promise<PaginatedResponse<NACHAFile>> {
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await this.supabase
      .from('nacha_files')
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get NACHA files: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    };
  }

  async updateNACHAFileTransmissionStatus(id: string, transmitted: boolean): Promise<void> {
    const updateData: any = { transmitted };
    if (transmitted) {
      updateData.transmittedAt = new Date().toISOString();
    }

    const { error } = await this.supabase
      .from('nacha_files')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update NACHA file transmission status: ${error.message}`);
    }
  }

  // Federal Holidays
  async createFederalHoliday(holiday: Omit<FederalHoliday, 'id'>): Promise<FederalHoliday> {
    const { data, error } = await this.supabase
      .from('federal_holidays')
      .insert([holiday])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create federal holiday: ${error.message}`);
    }

    return data;
  }

  async getFederalHolidays(year?: number): Promise<FederalHoliday[]> {
    let query = this.supabase
      .from('federal_holidays')
      .select('*')
      .order('date', { ascending: true });

    if (year) {
      query = query.eq('year', year);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get federal holidays: ${error.message}`);
    }

    return data || [];
  }

  async updateFederalHoliday(id: string, updates: Partial<FederalHoliday>): Promise<void> {
    const { error } = await this.supabase
      .from('federal_holidays')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update federal holiday: ${error.message}`);
    }
  }

  async deleteFederalHoliday(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('federal_holidays')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete federal holiday: ${error.message}`);
    }
  }

  // System Configuration
  async getSystemConfig(key: string): Promise<SystemConfig | null> {
    const { data, error } = await this.supabase
      .from('system_config')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get system config: ${error.message}`);
    }

    return data;
  }

  async setSystemConfig(key: string, value: string, description?: string): Promise<SystemConfig> {
    const configData = {
      key,
      value,
      description,
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('system_config')
      .upsert([configData], { onConflict: 'key' })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to set system config: ${error.message}`);
    }

    return data;
  }

  async getAllSystemConfig(): Promise<SystemConfig[]> {
    const { data, error } = await this.supabase
      .from('system_config')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      throw new Error(`Failed to get all system config: ${error.message}`);
    }

    return data || [];
  }

  // Users (for authentication and RBAC)
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const userData = {
      ...user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get user by email: ${error.message}`);
    }

    return data;
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get user by ID: ${error.message}`);
    }

    return data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}