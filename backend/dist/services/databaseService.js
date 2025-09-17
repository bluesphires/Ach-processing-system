"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class DatabaseService {
    constructor(supabaseUrl, supabaseKey) {
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    async createTransaction(transaction) {
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
    async getTransaction(id) {
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
    async getTransactions(page = 1, limit = 50, filters) {
        let query = this.supabase
            .from('ach_transactions')
            .select('*', { count: 'exact' });
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.effectiveDate) {
            query = query.eq('effectiveDate', filters.effectiveDate.toISOString());
        }
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
    async updateTransactionStatus(id, status) {
        const { error } = await this.supabase
            .from('ach_transactions')
            .update({ status, updatedAt: new Date().toISOString() })
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to update transaction status: ${error.message}`);
        }
    }
    async createNACHAFile(nachaFile) {
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
    async getNACHAFile(id) {
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
    async getNACHAFiles(page = 1, limit = 50) {
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
    async updateNACHAFileTransmissionStatus(id, transmitted) {
        const updateData = { transmitted };
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
    async createFederalHoliday(holiday) {
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
    async getFederalHolidays(year) {
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
    async updateFederalHoliday(id, updates) {
        const { error } = await this.supabase
            .from('federal_holidays')
            .update(updates)
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to update federal holiday: ${error.message}`);
        }
    }
    async deleteFederalHoliday(id) {
        const { error } = await this.supabase
            .from('federal_holidays')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete federal holiday: ${error.message}`);
        }
    }
    async getSystemConfig(key) {
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
    async setSystemConfig(key, value, description) {
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
    async getAllSystemConfig() {
        const { data, error } = await this.supabase
            .from('system_config')
            .select('*')
            .order('key', { ascending: true });
        if (error) {
            throw new Error(`Failed to get all system config: ${error.message}`);
        }
        return data || [];
    }
    async createUser(user) {
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
    async getUserByEmail(email) {
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
    async getUserById(id) {
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
    async updateUser(id, updates) {
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
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=databaseService.js.map