import express from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '@/services/databaseService';
import { EncryptionService } from '@/services/encryptionService';
import { BusinessDayService } from '@/services/businessDayService';
import { TransactionEntryService } from '@/services/transactionEntryService';
import { ACHTransaction, EncryptedTransaction, TransactionStatus, ApiResponse } from '@/types';
import { authMiddleware, requireOperator } from '@/middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Validation schema for ACH transaction
const transactionSchema = Joi.object({
  // Debit Information
  drRoutingNumber: Joi.string().pattern(/^\d{9}$/).required().messages({
    'string.pattern.base': 'DR Routing Number must be exactly 9 digits'
  }),
  drAccountNumber: Joi.string().min(1).max(17).required(),
  drId: Joi.string().max(15).required(),
  drName: Joi.string().max(22).required(),
  
  // Credit Information
  crRoutingNumber: Joi.string().pattern(/^\d{9}$/).required().messages({
    'string.pattern.base': 'CR Routing Number must be exactly 9 digits'
  }),
  crAccountNumber: Joi.string().min(1).max(17).required(),
  crId: Joi.string().max(15).required(),
  crName: Joi.string().max(22).required(),
  
  // Transaction Details
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be a positive number'
  }),
  effectiveDate: Joi.date().min('now').required().messages({
    'date.min': 'Effective date cannot be in the past'
  }),
  
  // Optional metadata
  senderDetails: Joi.string().max(255).optional()
});

// Validation schema for separate debit/credit transaction
const separateTransactionSchema = Joi.object({
  // Debit Information
  drRoutingNumber: Joi.string().pattern(/^\d{9}$/).required().messages({
    'string.pattern.base': 'DR Routing Number must be exactly 9 digits'
  }),
  drAccountNumber: Joi.string().min(1).max(17).required(),
  drId: Joi.string().max(15).required(),
  drName: Joi.string().max(22).required(),
  drEffectiveDate: Joi.date().min('now').required().messages({
    'date.min': 'DR Effective date cannot be in the past'
  }),
  
  // Credit Information
  crRoutingNumber: Joi.string().pattern(/^\d{9}$/).required().messages({
    'string.pattern.base': 'CR Routing Number must be exactly 9 digits'
  }),
  crAccountNumber: Joi.string().min(1).max(17).required(),
  crId: Joi.string().max(15).required(),
  crName: Joi.string().max(22).required(),
  crEffectiveDate: Joi.date().min('now').required().messages({
    'date.min': 'CR Effective date cannot be in the past'
  }),
  
  // Transaction Details
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be a positive number'
  }),
  
  // Optional metadata
  senderDetails: Joi.string().max(255).optional()
});

// Create a new ACH transaction
router.post('/', requireOperator, async (req, res) => {
  try {
    const { error, value } = transactionSchema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const encryptionService: EncryptionService = req.app.locals.encryptionService;
    const businessDayService: BusinessDayService = req.app.locals.businessDayService;

    // Get client IP address
    const senderIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Ensure effective date is a business day
    const effectiveDate = businessDayService.getACHEffectiveDate(new Date(value.effectiveDate));

    // Create transaction object
    const transaction: ACHTransaction = {
      id: uuidv4(),
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
      status: TransactionStatus.PENDING
    };

    // Encrypt sensitive account numbers
    const encryptedTransaction: EncryptedTransaction = {
      ...transaction,
      drAccountNumberEncrypted: encryptionService.encrypt(transaction.drAccountNumber),
      crAccountNumberEncrypted: encryptionService.encrypt(transaction.crAccountNumber)
    };

    // Remove unencrypted account numbers
    delete (encryptedTransaction as any).drAccountNumber;
    delete (encryptedTransaction as any).crAccountNumber;

    // Save to database
    const savedTransaction = await databaseService.createTransaction(encryptedTransaction);

    const response: ApiResponse = {
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
  } catch (error) {
    console.error('Create transaction error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create ACH transaction'
    };
    res.status(500).json(response);
  }
});

// Create a new transaction with separate debit and credit entries
router.post('/separate', requireOperator, async (req, res) => {
  try {
    const { error, value } = separateTransactionSchema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const encryptionService: EncryptionService = req.app.locals.encryptionService;
    const businessDayService: BusinessDayService = req.app.locals.businessDayService;

    // Create transaction entry service
    const transactionEntryService = new TransactionEntryService(
      databaseService,
      encryptionService,
      businessDayService
    );

    // Get client IP address
    const senderIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Create separate transaction
    const transactionGroup = await transactionEntryService.createSeparateTransaction(
      value,
      senderIp
    );

    const response: ApiResponse = {
      success: true,
      data: {
        id: transactionGroup.id,
        drEntryId: transactionGroup.drEntryId,
        crEntryId: transactionGroup.crEntryId,
        amount: value.amount,
        drEffectiveDate: value.drEffectiveDate,
        crEffectiveDate: value.crEffectiveDate,
        createdAt: transactionGroup.createdAt
      },
      message: 'Separate debit/credit transaction created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create separate transaction error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create separate debit/credit transaction'
    };
    res.status(500).json(response);
  }
});

// Get all ACH transactions with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const querySchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(50),
      status: Joi.string().valid(...Object.values(TransactionStatus)).optional(),
      effectiveDate: Joi.date().optional()
    });

    const { error, value } = querySchema.validate(req.query);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const encryptionService: EncryptionService = req.app.locals.encryptionService;

    const filters: any = {};
    if (value.status) filters.status = value.status;
    if (value.effectiveDate) filters.effectiveDate = new Date(value.effectiveDate);

    const result = await databaseService.getTransactions(value.page, value.limit, filters);

    // Decrypt account numbers for display (last 4 digits only)
    const transactionsWithMaskedAccounts = result.data!.map(tx => {
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
      } catch (decryptError) {
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

    const response: ApiResponse = {
      success: true,
      data: transactionsWithMaskedAccounts,
      pagination: result.pagination
    };

    res.json(response);
  } catch (error) {
    console.error('Get transactions error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve ACH transactions'
    };
    res.status(500).json(response);
  }
});

// Get a specific ACH transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const encryptionService: EncryptionService = req.app.locals.encryptionService;

    const transaction = await databaseService.getTransaction(id);
    
    if (!transaction) {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction not found'
      };
      return res.status(404).json(response);
    }

    // Decrypt account numbers for display (masked for security)
    let drAccountNumber = '****ERROR';
    let crAccountNumber = '****ERROR';
    
    try {
      const drAccountFull = encryptionService.decrypt(transaction.drAccountNumberEncrypted);
      const crAccountFull = encryptionService.decrypt(transaction.crAccountNumberEncrypted);
      drAccountNumber = '****' + drAccountFull.slice(-4);
      crAccountNumber = '****' + crAccountFull.slice(-4);
    } catch (decryptError) {
      console.error('Decryption error for transaction', id, decryptError);
    }

    const response: ApiResponse = {
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
  } catch (error) {
    console.error('Get transaction error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve ACH transaction'
    };
    res.status(500).json(response);
  }
});

// Update transaction status
router.patch('/:id/status', requireOperator, async (req, res) => {
  try {
    const { id } = req.params;
    const statusSchema = Joi.object({
      status: Joi.string().valid(...Object.values(TransactionStatus)).required()
    });

    const { error, value } = statusSchema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;

    // Check if transaction exists
    const transaction = await databaseService.getTransaction(id);
    if (!transaction) {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction not found'
      };
      return res.status(404).json(response);
    }

    await databaseService.updateTransactionStatus(id, value.status);

    const response: ApiResponse = {
      success: true,
      message: 'Transaction status updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Update transaction status error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update transaction status'
    };
    res.status(500).json(response);
  }
});

// Get transaction statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const databaseService: DatabaseService = req.app.locals.databaseService;

    // Get transactions for current month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // This is a simplified implementation
    // In a real application, you'd want more efficient aggregation queries
    const allTransactions = await databaseService.getTransactions(1, 1000);
    
    const stats = {
      totalTransactions: allTransactions.data?.length || 0,
      pendingTransactions: allTransactions.data?.filter(tx => tx.status === TransactionStatus.PENDING).length || 0,
      processedTransactions: allTransactions.data?.filter(tx => tx.status === TransactionStatus.PROCESSED).length || 0,
      failedTransactions: allTransactions.data?.filter(tx => tx.status === TransactionStatus.FAILED).length || 0,
      totalAmount: allTransactions.data?.reduce((sum, tx) => sum + tx.amount, 0) || 0,
      averageAmount: allTransactions.data?.length ? 
        (allTransactions.data.reduce((sum, tx) => sum + tx.amount, 0) / allTransactions.data.length) : 0
    };

    const response: ApiResponse = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Get transaction stats error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve transaction statistics'
    };
    res.status(500).json(response);
  }
});

// Get transaction entries (new separate debit/credit structure)
router.get('/entries', async (req, res) => {
  try {
    const querySchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(50),
      status: Joi.string().valid(...Object.values(TransactionStatus)).optional(),
      effectiveDate: Joi.date().optional(),
      entryType: Joi.string().valid('DR', 'CR').optional()
    });

    const { error, value } = querySchema.validate(req.query);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const encryptionService: EncryptionService = req.app.locals.encryptionService;
    const businessDayService: BusinessDayService = req.app.locals.businessDayService;

    // Create transaction entry service
    const transactionEntryService = new TransactionEntryService(
      databaseService,
      encryptionService,
      businessDayService
    );

    const filters: TransactionEntryFilters = {};
    if (value.status) filters.status = value.status;
    if (value.effectiveDate) filters.effectiveDate = new Date(value.effectiveDate);
    if (value.entryType) filters.entryType = value.entryType;

    const result = await transactionEntryService.getTransactionEntriesForDisplay(
      value.page, 
      value.limit, 
      filters
    );

    const response: ApiResponse = {
      success: true,
      data: result.data,
      pagination: result.pagination
    };

    res.json(response);
  } catch (error) {
    console.error('Get transaction entries error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve transaction entries'
    };
    res.status(500).json(response);
  }
});

// Get transaction groups (linked debit/credit pairs)
router.get('/groups', async (req, res) => {
  try {
    const querySchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(50)
    });

    const { error, value } = querySchema.validate(req.query);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;

    const result = await databaseService.getTransactionGroups(value.page, value.limit);

    const response: ApiResponse = {
      success: true,
      data: result.data,
      pagination: result.pagination
    };

    res.json(response);
  } catch (error) {
    console.error('Get transaction groups error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve transaction groups'
    };
    res.status(500).json(response);
  }
});

export { router as transactionRouter };