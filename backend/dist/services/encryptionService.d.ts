export declare class EncryptionService {
    private readonly algorithm;
    private readonly key;
    constructor(encryptionKey: string);
    encrypt(text: string): string;
    decrypt(encryptedText: string): string;
    hash(text: string): string;
    generateToken(length?: number): string;
}
//# sourceMappingURL=encryptionService.d.ts.map