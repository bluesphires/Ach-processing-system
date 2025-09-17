"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRouter = void 0;
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const uuid_1 = require("uuid");
const types_1 = require("@/types");
const auth_1 = require("@/middleware/auth");
const router = express_1.default.Router();
exports.transactionRouter = router;
router.use(auth_1.authMiddleware);
const transactionSchema = joi_1.default.object({
    drRoutingNumber: joi_1.default.string().pattern(/^\d{9}$/).required().messages({
        'string.pattern.base': 'DR Routing Number must be exactly 9 digits'
    }),
    drAccountNumber: joi_1.default.string().min(1).max(17).required(),
    drId: joi_1.default.string().max(15).required(),
    drName: joi_1.default.string().max(22).required(),
    crRoutingNumber: joi_1.default.string().pattern(/^\d{9}$/).required().messages({
        'string.pattern.base': 'CR Routing Number must be exactly 9 digits'
    }),
    crAccountNumber: joi_1.default.string().min(1).max(17).required(),
    crId: joi_1.default.string().max(15).required(),
    crName: joi_1.default.string().max(22).required(),
    amount: joi_1.default.number().positive().precision(2).required().messages({
        'number.positive': 'Amount must be a positive number'
    }),
    effectiveDate: joi_1.default.date().min('now').required().messages({
        'date.min': 'Effective date cannot be in the past'
    }),
    senderDetails: joi_1.default.string().max(255).optional()
});
router.post('/', auth_1.requireOperator, async (req, res) => {
    try {
        const { error, value } = transactionSchema.validate(req.body);
        if (error) {
            const response = {
                success: false,
                error: error.details[0].message
            };
            return res.status(400).json(response);
        }
        const databaseService = req.app.locals.databaseService;
        const encryptionService = req.app.locals.encryptionService;
        const businessDayService = req.app.locals.businessDayService;
        const senderIp = req.ip || req.connection.remoteAddress || 'unknown';
        const effectiveDate = businessDayService.getACHEffectiveDate(new Date(value.effectiveDate));
        const transaction = {
            id: (0, uuid_1.v4)(),
            drRoutingNumber: value.drRoutingNumber,
            drAccountNumber: value.drAccountNumber,
            drId: value.drId,
            drName: value.drName,
            crRoutingNumber: value.crRoutingNumber,
            crAccountNumber: value.crAccountNumber,
            crId: value.crId,
            crName: value.crName,
            amount: value.amount,
            effectiveDate,
            senderIp,
            senderDetails: value.senderDetails,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: types_1.TransactionStatus.PENDING
        };
        const encryptedTransaction = {
            ...transaction,
            drAccountNumberEncrypted: encryptionService.encrypt(transaction.drAccountNumber),
            crAccountNumberEncrypted: encryptionService.encrypt(transaction.crAccountNumber)
        };
        delete encryptedTransaction.drAccountNumber;
        delete encryptedTransaction.crAccountNumber;
        const savedTransaction = await databaseService.createTransaction(encryptedTransaction);
        const response = {
            success: true,
            data: {
                id: savedTransaction.id,
                drRoutingNumber: savedTransaction.drRoutingNumber,
                drId: savedTransaction.drId,
                drName: savedTransaction.drName,
                crRoutingNumber: savedTransaction.crRoutingNumber,
                crId: savedTransaction.crId,
                crName: savedTransaction.crName,
                amount: savedTransaction.amount,
                effectiveDate: savedTransaction.effectiveDate,
                status: savedTransaction.status,
                createdAt: savedTransaction.createdAt
            },
            message: 'ACH transaction created successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Create transaction error:', error);
        const response = {
            success: false,
            error: 'Failed to create ACH transaction'
        };
        res.status(500).json(response);
    }
});
router.get('/', async (req, res) => {
    try {
        const querySchema = joi_1.default.object({
            page: joi_1.default.number().integer().min(1).default(1),
            limit: joi_1.default.number().integer().min(1).max(100).default(50),
            status: joi_1.default.string().valid(...Object.values(types_1.TransactionStatus)).optional(),
            effectiveDate: joi_1.default.date().optional()
        });
        const { error, value } = querySchema.validate(req.query);
        if (error) {
            const response = {
                success: false,
                error: error.details[0].message
            };
            return res.status(400).json(response);
        }
        const databaseService = req.app.locals.databaseService;
        const encryptionService = req.app.locals.encryptionService;
        const filters = {};
        if (value.status)
            filters.status = value.status;
        if (value.effectiveDate)
            filters.effectiveDate = new Date(value.effectiveDate);
        const result = await databaseService.getTransactions(value.page, value.limit, filters);
        const transactionsWithMaskedAccounts = result.data.map(tx => {
            try {
                const drAccountFull = encryptionService.decrypt(tx.drAccountNumberEncrypted);
                const crAccountFull = encryptionService.decrypt(tx.crAccountNumberEncrypted);
                return {
                    ...tx,
                    drAccountNumber: '****' + drAccountFull.slice(-4),
                    crAccountNumber: '****' + crAccountFull.slice(-4),
                    drAccountNumberEncrypted: undefined,
                    crAccountNumberEncrypted: undefined
                };
            }
            catch (decryptError) {
                console.error('Decryption error for transaction', tx.id, decryptError);
                return {
                    ...tx,
                    drAccountNumber: '****ERROR',
                    crAccountNumber: '****ERROR',
                    drAccountNumberEncrypted: undefined,
                    crAccountNumberEncrypted: undefined
                };
            }
        });
        const response = {
            success: true,
            data: transactionsWithMaskedAccounts,
            pagination: result.pagination
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get transactions error:', error);
        const response = {
            success: false,
            error: 'Failed to retrieve ACH transactions'
        };
        res.status(500).json(response);
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const databaseService = req.app.locals.databaseService;
        const encryptionService = req.app.locals.encryptionService;
        const transaction = await databaseService.getTransaction(id);
        if (!transaction) {
            const response = {
                success: false,
                error: 'Transaction not found'
            };
            return res.status(404).json(response);
        }
        let drAccountNumber = '****ERROR';
        let crAccountNumber = '****ERROR';
        try {
            const drAccountFull = encryptionService.decrypt(transaction.drAccountNumberEncrypted);
            const crAccountFull = encryptionService.decrypt(transaction.crAccountNumberEncrypted);
            drAccountNumber = '****' + drAccountFull.slice(-4);
            crAccountNumber = '****' + crAccountFull.slice(-4);
        }
        catch (decryptError) {
            console.error('Decryption error for transaction', id, decryptError);
        }
        const response = {
            success: true,
            data: {
                ...transaction,
                drAccountNumber,
                crAccountNumber,
                drAccountNumberEncrypted: undefined,
                crAccountNumberEncrypted: undefined
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get transaction error:', error);
        const response = {
            success: false,
            error: 'Failed to retrieve ACH transaction'
        };
        res.status(500).json(response);
    }
});
router.patch('/:id/status', auth_1.requireOperator, async (req, res) => {
    try {
        const { id } = req.params;
        const statusSchema = joi_1.default.object({
            status: joi_1.default.string().valid(...Object.values(types_1.TransactionStatus)).required()
        });
        const { error, value } = statusSchema.validate(req.body);
        if (error) {
            const response = {
                success: false,
                error: error.details[0].message
            };
            return res.status(400).json(response);
        }
        const databaseService = req.app.locals.databaseService;
        const transaction = await databaseService.getTransaction(id);
        if (!transaction) {
            const response = {
                success: false,
                error: 'Transaction not found'
            };
            return res.status(404).json(response);
        }
        await databaseService.updateTransactionStatus(id, value.status);
        const response = {
            success: true,
            message: 'Transaction status updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update transaction status error:', error);
        const response = {
            success: false,
            error: 'Failed to update transaction status'
        };
        res.status(500).json(response);
    }
});
router.get('/stats/summary', async (req, res) => {
    try {
        const databaseService = req.app.locals.databaseService;
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const allTransactions = await databaseService.getTransactions(1, 1000);
        const stats = {
            totalTransactions: allTransactions.data?.length || 0,
            pendingTransactions: allTransactions.data?.filter(tx => tx.status === types_1.TransactionStatus.PENDING).length || 0,
            processedTransactions: allTransactions.data?.filter(tx => tx.status === types_1.TransactionStatus.PROCESSED).length || 0,
            failedTransactions: allTransactions.data?.filter(tx => tx.status === types_1.TransactionStatus.FAILED).length || 0,
            totalAmount: allTransactions.data?.reduce((sum, tx) => sum + tx.amount, 0) || 0,
            averageAmount: allTransactions.data?.length ?
                (allTransactions.data.reduce((sum, tx) => sum + tx.amount, 0) / allTransactions.data.length) : 0
        };
        const response = {
            success: true,
            data: stats
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get transaction stats error:', error);
        const response = {
            success: false,
            error: 'Failed to retrieve transaction statistics'
        };
        res.status(500).json(response);
    }
});
//# sourceMappingURL=transactions.js.map