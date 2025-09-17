"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class EncryptionService {
    constructor(encryptionKey) {
        this.algorithm = 'aes-256-cbc';
        this.key = crypto_1.default.scryptSync(encryptionKey, 'salt', 32);
    }
    encrypt(text) {
        try {
            const iv = crypto_1.default.randomBytes(16);
            const cipher = crypto_1.default.createCipher(this.algorithm, this.key);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return iv.toString('hex') + ':' + encrypted;
        }
        catch (error) {
            throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    decrypt(encryptedText) {
        try {
            const [ivHex, encrypted] = encryptedText.split(':');
            if (!ivHex || !encrypted) {
                throw new Error('Invalid encrypted data format');
            }
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto_1.default.createDecipher(this.algorithm, this.key);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    hash(text) {
        return crypto_1.default.createHash('sha256').update(text).digest('hex');
    }
    generateToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
}
exports.EncryptionService = EncryptionService;
//# sourceMappingURL=encryptionService.js.map