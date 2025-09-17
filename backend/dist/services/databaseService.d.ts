import { EncryptedTransaction, NACHAFile, FederalHoliday, SystemConfig, User, PaginatedResponse } from '@/types';
export declare class DatabaseService {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
    createTransaction(transaction: EncryptedTransaction): Promise<EncryptedTransaction>;
    getTransaction(id: string): Promise<EncryptedTransaction | null>;
    getTransactions(page?: number, limit?: number, filters?: {
        status?: string;
        effectiveDate?: Date;
    }): Promise<PaginatedResponse<EncryptedTransaction>>;
    updateTransactionStatus(id: string, status: string): Promise<void>;
    createNACHAFile(nachaFile: Omit<NACHAFile, 'id' | 'createdAt'>): Promise<NACHAFile>;
    getNACHAFile(id: string): Promise<NACHAFile | null>;
    getNACHAFiles(page?: number, limit?: number): Promise<PaginatedResponse<NACHAFile>>;
    updateNACHAFileTransmissionStatus(id: string, transmitted: boolean): Promise<void>;
    createFederalHoliday(holiday: Omit<FederalHoliday, 'id'>): Promise<FederalHoliday>;
    getFederalHolidays(year?: number): Promise<FederalHoliday[]>;
    updateFederalHoliday(id: string, updates: Partial<FederalHoliday>): Promise<void>;
    deleteFederalHoliday(id: string): Promise<void>;
    getSystemConfig(key: string): Promise<SystemConfig | null>;
    setSystemConfig(key: string, value: string, description?: string): Promise<SystemConfig>;
    getAllSystemConfig(): Promise<SystemConfig[]>;
    createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
    getUserByEmail(email: string): Promise<User | null>;
    getUserById(id: string): Promise<User | null>;
    updateUser(id: string, updates: Partial<User>): Promise<void>;
}
//# sourceMappingURL=databaseService.d.ts.map