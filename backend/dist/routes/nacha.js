"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nachaRouter = void 0;
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const types_1 = require("@/types");
const auth_1 = require("@/middleware/auth");
const router = express_1.default.Router();
exports.nachaRouter = router;
router.use(auth_1.authMiddleware);
router.post('/generate', auth_1.requireOperator, async (req, res) => {
    try {
        const generateSchema = joi_1.default.object({
            effectiveDate: joi_1.default.date().required(),
            fileType: joi_1.default.string().valid('DR', 'CR').required()
        });
        const { error, value } = generateSchema.validate(req.body);
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
        const nachaService = req.app.locals.nachaService;
        const { effectiveDate, fileType } = value;
        let targetEffectiveDate = new Date(effectiveDate);
        if (fileType === 'CR') {
            targetEffectiveDate = businessDayService.getCreditEffectiveDate(targetEffectiveDate);
        }
        const transactionsResult = await databaseService.getTransactions(1, 1000, {
            effectiveDate: targetEffectiveDate,
            status: types_1.TransactionStatus.PENDING
        });
        if (!transactionsResult.data || transactionsResult.data.length === 0) {
            const response = {
                success: false,
                error: `No pending transactions found for effective date ${targetEffectiveDate.toISOString().split('T')[0]}`
            };
            return res.status(404).json(response);
        }
        const decryptedTransactions = transactionsResult.data.map(tx => {
            const drAccountNumber = encryptionService.decrypt(tx.drAccountNumberEncrypted);
            const crAccountNumber = encryptionService.decrypt(tx.crAccountNumberEncrypted);
            return {
                ...tx,
                drAccountNumber,
                crAccountNumber
            };
        });
        const nachaFile = nachaService.generateNACHAFile(decryptedTransactions, targetEffectiveDate, fileType);
        const savedNachaFile = await databaseService.createNACHAFile({
            filename: nachaFile.filename,
            content: nachaFile.content,
            effectiveDate: nachaFile.effectiveDate,
            transactionCount: nachaFile.transactionCount,
            totalAmount: nachaFile.totalAmount,
            transmitted: false
        });
        await Promise.all(decryptedTransactions.map(tx => databaseService.updateTransactionStatus(tx.id, types_1.TransactionStatus.PROCESSED)));
        nachaService.incrementSequenceNumber();
        const response = {
            success: true,
            data: {
                id: savedNachaFile.id,
                filename: savedNachaFile.filename,
                effectiveDate: savedNachaFile.effectiveDate,
                transactionCount: savedNachaFile.transactionCount,
                totalAmount: savedNachaFile.totalAmount,
                createdAt: savedNachaFile.createdAt
            },
            message: `NACHA ${fileType} file generated successfully`
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Generate NACHA file error:', error);
        const response = {
            success: false,
            error: 'Failed to generate NACHA file'
        };
        res.status(500).json(response);
    }
});
router.get('/files', async (req, res) => {
    try {
        const querySchema = joi_1.default.object({
            page: joi_1.default.number().integer().min(1).default(1),
            limit: joi_1.default.number().integer().min(1).max(100).default(50)
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
        const result = await databaseService.getNACHAFiles(value.page, value.limit);
        const filesWithoutContent = result.data.map(file => ({
            ...file,
            content: undefined
        }));
        const response = {
            success: true,
            data: filesWithoutContent,
            pagination: result.pagination
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get NACHA files error:', error);
        const response = {
            success: false,
            error: 'Failed to retrieve NACHA files'
        };
        res.status(500).json(response);
    }
});
router.get('/files/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const databaseService = req.app.locals.databaseService;
        const nachaFile = await databaseService.getNACHAFile(id);
        if (!nachaFile) {
            const response = {
                success: false,
                error: 'NACHA file not found'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: nachaFile
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get NACHA file error:', error);
        const response = {
            success: false,
            error: 'Failed to retrieve NACHA file'
        };
        res.status(500).json(response);
    }
});
router.get('/files/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        const databaseService = req.app.locals.databaseService;
        const nachaFile = await databaseService.getNACHAFile(id);
        if (!nachaFile) {
            const response = {
                success: false,
                error: 'NACHA file not found'
            };
            return res.status(404).json(response);
        }
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${nachaFile.filename}"`);
        res.send(nachaFile.content);
    }
    catch (error) {
        console.error('Download NACHA file error:', error);
        const response = {
            success: false,
            error: 'Failed to download NACHA file'
        };
        res.status(500).json(response);
    }
});
router.post('/files/:id/validate', async (req, res) => {
    try {
        const { id } = req.params;
        const databaseService = req.app.locals.databaseService;
        const nachaService = req.app.locals.nachaService;
        const nachaFile = await databaseService.getNACHAFile(id);
        if (!nachaFile) {
            const response = {
                success: false,
                error: 'NACHA file not found'
            };
            return res.status(404).json(response);
        }
        const validation = nachaService.validateNACHAFile(nachaFile.content);
        const response = {
            success: true,
            data: {
                isValid: validation.isValid,
                errors: validation.errors,
                filename: nachaFile.filename
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Validate NACHA file error:', error);
        const response = {
            success: false,
            error: 'Failed to validate NACHA file'
        };
        res.status(500).json(response);
    }
});
router.patch('/files/:id/transmitted', auth_1.requireOperator, async (req, res) => {
    try {
        const { id } = req.params;
        const databaseService = req.app.locals.databaseService;
        const nachaFile = await databaseService.getNACHAFile(id);
        if (!nachaFile) {
            const response = {
                success: false,
                error: 'NACHA file not found'
            };
            return res.status(404).json(response);
        }
        await databaseService.updateNACHAFileTransmissionStatus(id, true);
        const response = {
            success: true,
            message: 'NACHA file marked as transmitted'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update NACHA file transmission status error:', error);
        const response = {
            success: false,
            error: 'Failed to update NACHA file transmission status'
        };
        res.status(500).json(response);
    }
});
router.get('/stats/generation', async (req, res) => {
    try {
        const databaseService = req.app.locals.databaseService;
        const allFiles = await databaseService.getNACHAFiles(1, 1000);
        const stats = {
            totalFiles: allFiles.data?.length || 0,
            transmittedFiles: allFiles.data?.filter(file => file.transmitted).length || 0,
            pendingFiles: allFiles.data?.filter(file => !file.transmitted).length || 0,
            totalTransactionCount: allFiles.data?.reduce((sum, file) => sum + file.transactionCount, 0) || 0,
            totalAmount: allFiles.data?.reduce((sum, file) => sum + file.totalAmount, 0) || 0,
            averageFileSize: allFiles.data?.length ?
                (allFiles.data.reduce((sum, file) => sum + file.transactionCount, 0) / allFiles.data.length) : 0
        };
        const response = {
            success: true,
            data: stats
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get NACHA generation stats error:', error);
        const response = {
            success: false,
            error: 'Failed to retrieve NACHA generation statistics'
        };
        res.status(500).json(response);
    }
});
//# sourceMappingURL=nacha.js.map