"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NACHAService = void 0;
const moment_1 = __importDefault(require("moment"));
class NACHAService {
    constructor(config) {
        this.fileSequenceNumber = 1;
        this.config = config;
    }
    generateNACHAFile(transactions, effectiveDate, fileType = 'DR') {
        const filename = this.generateFilename(effectiveDate, fileType);
        const content = this.generateFileContent(transactions, effectiveDate, fileType);
        const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        return {
            id: this.generateId(),
            filename,
            content,
            effectiveDate,
            transactionCount: transactions.length,
            totalAmount,
            createdAt: new Date(),
            transmitted: false
        };
    }
    generateFileContent(transactions, effectiveDate, fileType) {
        const lines = [];
        lines.push(this.generateFileHeader(effectiveDate));
        lines.push(this.generateBatchHeader(effectiveDate, fileType));
        transactions.forEach(transaction => {
            lines.push(this.generateEntryDetail(transaction, fileType));
        });
        lines.push(this.generateBatchControl(transactions, fileType));
        lines.push(this.generateFileControl(transactions));
        const recordCount = lines.length;
        const paddingNeeded = 10 - (recordCount % 10);
        if (paddingNeeded !== 10) {
            for (let i = 0; i < paddingNeeded; i++) {
                lines.push('9'.repeat(94));
            }
        }
        return lines.join('\n');
    }
    generateFileHeader(effectiveDate) {
        const creationDate = (0, moment_1.default)().format('YYMMDD');
        const creationTime = (0, moment_1.default)().format('HHmm');
        return [
            '1',
            '01',
            this.padLeft(this.config.immediateDestination, 10, ' '),
            this.padLeft(this.config.immediateOrigin, 10, ' '),
            creationDate,
            creationTime,
            this.padLeft(this.fileSequenceNumber.toString(), 1, 'A'),
            '094',
            '10',
            '1',
            this.padRight(this.config.immediateDestination, 23, ' '),
            this.padRight(this.config.immediateOrigin, 23, ' '),
            this.padRight('', 8, ' ')
        ].join('');
    }
    generateBatchHeader(effectiveDate, fileType) {
        const serviceClassCode = fileType === 'DR' ? '225' : '220';
        const effectiveDateStr = (0, moment_1.default)(effectiveDate).format('YYMMDD');
        return [
            '5',
            serviceClassCode,
            this.padRight(this.config.companyName, 16, ' '),
            this.padRight(this.config.companyDiscretionaryData || '', 20, ' '),
            this.config.companyId,
            'CCD',
            this.padRight(`${fileType} PAYMENT`, 10, ' '),
            this.padRight('', 6, ' '),
            effectiveDateStr,
            this.padRight('', 3, ' '),
            '1',
            this.config.originatingDFI.substring(0, 8),
            '0000001'
        ].join('');
    }
    generateEntryDetail(transaction, fileType) {
        const transactionCode = fileType === 'DR' ? '27' : '22';
        const routingNumber = fileType === 'DR' ? transaction.drRoutingNumber : transaction.crRoutingNumber;
        const accountNumber = fileType === 'DR' ? transaction.drAccountNumber : transaction.crAccountNumber;
        const individualName = fileType === 'DR' ? transaction.drName : transaction.crName;
        const individualId = fileType === 'DR' ? transaction.drId : transaction.crId;
        const amount = Math.round(transaction.amount * 100);
        return [
            '6',
            transactionCode,
            routingNumber.substring(0, 8),
            routingNumber.substring(8, 9),
            this.padLeft(accountNumber, 17, ' '),
            this.padLeft(amount.toString(), 10, '0'),
            this.padLeft(individualId, 15, ' '),
            this.padRight(individualName, 22, ' '),
            this.padRight('', 2, ' '),
            '0',
            this.padLeft((this.getTraceNumber()).toString(), 15, '0')
        ].join('');
    }
    generateBatchControl(transactions, fileType) {
        const serviceClassCode = fileType === 'DR' ? '225' : '220';
        const entryCount = transactions.length;
        const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const totalAmountCents = Math.round(totalAmount * 100);
        const entryHash = transactions.reduce((sum, tx) => {
            const routingNumber = fileType === 'DR' ? tx.drRoutingNumber : tx.crRoutingNumber;
            return sum + parseInt(routingNumber.substring(0, 8));
        }, 0);
        return [
            '8',
            serviceClassCode,
            this.padLeft(entryCount.toString(), 6, '0'),
            this.padLeft((entryHash % 10000000000).toString(), 10, '0'),
            this.padLeft(totalAmountCents.toString(), 12, '0'),
            this.padLeft('0', 12, '0'),
            this.config.companyId,
            this.padRight('', 19, ' '),
            this.padRight('', 6, ' '),
            this.config.originatingDFI.substring(0, 8),
            '0000001'
        ].join('');
    }
    generateFileControl(transactions) {
        const batchCount = 1;
        const blockCount = Math.ceil((5 + transactions.length) / 10);
        const entryCount = transactions.length;
        const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const totalAmountCents = Math.round(totalAmount * 100);
        const entryHash = transactions.reduce((sum, tx) => {
            const drHash = parseInt(tx.drRoutingNumber.substring(0, 8));
            const crHash = parseInt(tx.crRoutingNumber.substring(0, 8));
            return sum + drHash + crHash;
        }, 0);
        return [
            '9',
            this.padLeft(batchCount.toString(), 6, '0'),
            this.padLeft(blockCount.toString(), 6, '0'),
            this.padLeft(entryCount.toString(), 8, '0'),
            this.padLeft((entryHash % 10000000000).toString(), 10, '0'),
            this.padLeft(totalAmountCents.toString(), 12, '0'),
            this.padLeft(totalAmountCents.toString(), 12, '0'),
            this.padRight('', 39, ' ')
        ].join('');
    }
    generateFilename(effectiveDate, fileType) {
        const dateStr = (0, moment_1.default)(effectiveDate).format('YYYYMMDD');
        const timeStr = (0, moment_1.default)().format('HHmmss');
        return `ACH_${fileType}_${dateStr}_${timeStr}.txt`;
    }
    generateId() {
        return `nacha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getTraceNumber() {
        return parseInt(this.config.originatingDFI.substring(0, 8)) * 10000000 +
            Math.floor(Math.random() * 10000000);
    }
    padLeft(str, length, padChar) {
        return str.padStart(length, padChar).substring(0, length);
    }
    padRight(str, length, padChar) {
        return str.padEnd(length, padChar).substring(0, length);
    }
    validateNACHAFile(content) {
        const errors = [];
        const lines = content.split('\n');
        if (lines.length < 4) {
            errors.push('File must have at least 4 records (header, batch header, batch control, file control)');
        }
        if (lines.length > 0 && !lines[0].startsWith('1')) {
            errors.push('First record must be File Header (type 1)');
        }
        if (lines.length > 1 && !lines[1].startsWith('5')) {
            errors.push('Second record must be Batch Header (type 5)');
        }
        lines.forEach((line, index) => {
            if (line.length !== 94 && index < lines.length - 1) {
                errors.push(`Line ${index + 1} must be exactly 94 characters`);
            }
        });
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    incrementSequenceNumber() {
        this.fileSequenceNumber++;
        if (this.fileSequenceNumber > 9) {
            this.fileSequenceNumber = 1;
        }
    }
}
exports.NACHAService = NACHAService;
//# sourceMappingURL=nachaService.js.map