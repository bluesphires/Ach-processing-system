import { ACHTransaction, NACHAFile } from '@/types';
export interface NACHAConfig {
    immediateDestination: string;
    immediateOrigin: string;
    companyName: string;
    companyId: string;
    companyDiscretionaryData?: string;
    originatingDFI: string;
}
export declare class NACHAService {
    private config;
    private fileSequenceNumber;
    constructor(config: NACHAConfig);
    generateNACHAFile(transactions: ACHTransaction[], effectiveDate: Date, fileType?: 'DR' | 'CR'): NACHAFile;
    private generateFileContent;
    private generateFileHeader;
    private generateBatchHeader;
    private generateEntryDetail;
    private generateBatchControl;
    private generateFileControl;
    private generateFilename;
    private generateId;
    private getTraceNumber;
    private padLeft;
    private padRight;
    validateNACHAFile(content: string): {
        isValid: boolean;
        errors: string[];
    };
    incrementSequenceNumber(): void;
}
//# sourceMappingURL=nachaService.d.ts.map