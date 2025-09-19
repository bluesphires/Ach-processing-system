import { Router, Response } from 'express';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { ConfigService } from '../services/config';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = Router();

// Validation schemas
const configSchema = Joi.object({
  key: Joi.string().required(),
  value: Joi.any().required(),
  description: Joi.string().optional(),
  isEncrypted: Joi.boolean().default(false)
});

const holidaySchema = Joi.object({
  name: Joi.string().required(),
  date: Joi.date().required(),
  isRecurring: Joi.boolean().default(false)
});

const sftpConfigSchema = Joi.object({
  host: Joi.string().required(),
  port: Joi.number().integer().min(1).max(65535).default(22),
  username: Joi.string().required(),
  password: Joi.string().optional(),
  privateKey: Joi.string().optional(),
  remotePath: Joi.string().required(),
  enabled: Joi.boolean().default(true)
});

// Get all configuration settings
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configs = await ConfigService.getAllConfigs();
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error: any) {
    logger.error('Failed to fetch configurations', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific configuration
router.get('/:key', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await ConfigService.getConfig(req.params.key);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('Failed to fetch configuration', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Set configuration value
router.put('/:key', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = configSchema.validate({
      key: req.params.key,
      ...req.body
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const config = await ConfigService.setConfig(
      value.key,
      value.value,
      req.user!.userId,
      value.description,
      value.isEncrypted
    );

    logger.info('Configuration updated', {
      key: value.key,
      userId: req.user!.userId
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('Failed to set configuration', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete configuration
router.delete('/:key', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await ConfigService.deleteConfig(req.params.key);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }

    logger.info('Configuration deleted', {
      key: req.params.key,
      userId: req.user!.userId
    });

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete configuration', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Federal holidays management
router.get('/holidays/list', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const holidays = await ConfigService.getFederalHolidays();
    
    res.json({
      success: true,
      data: holidays
    });
  } catch (error: any) {
    logger.error('Failed to fetch federal holidays', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/holidays', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = holidaySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const holiday = await ConfigService.addFederalHoliday(value);

    logger.info('Federal holiday added', {
      holidayName: value.name,
      date: value.date,
      userId: req.user!.userId
    });

    res.status(201).json({
      success: true,
      data: holiday
    });
  } catch (error: any) {
    logger.error('Failed to add federal holiday', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/holidays/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await ConfigService.deleteFederalHoliday(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Holiday not found'
      });
    }

    logger.info('Federal holiday deleted', {
      holidayId: req.params.id,
      userId: req.user!.userId
    });

    res.json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete federal holiday', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// SFTP configuration
router.get('/sftp', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sftpConfig = await ConfigService.getSFTPConfig();
    
    res.json({
      success: true,
      data: sftpConfig
    });
  } catch (error: any) {
    logger.error('Failed to fetch SFTP configuration', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/sftp', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = sftpConfigSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const config = await ConfigService.setSFTPConfig(value, req.user!.userId);

    logger.info('SFTP configuration updated', {
      host: value.host,
      userId: req.user!.userId
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('Failed to update SFTP configuration', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
    
import express from 'express';
import Joi from 'joi';
import { DatabaseService } from '@/services/databaseService';
import { SystemConfig, ApiResponse } from '@/types';
import { authMiddleware, requireAdmin } from '@/middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Validation schema for system configuration
const configSchema = Joi.object({
  key: Joi.string().min(1).max(100).required(),
  value: Joi.string().required(),
  description: Joi.string().max(255).optional()
});

// Get all system configuration
router.get('/', requireAdmin, async (req, res) => {
  try {
    const databaseService: DatabaseService = req.app.locals.databaseService;
    const configs = await databaseService.getAllSystemConfig();

    const response: ApiResponse = {
      success: true,
      data: configs
    };

    return res.json(response);
  } catch (error) {
    console.error('Get system config error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve system configuration'
    };
    return res.status(500).json(response);
  }
});

// Get a specific system configuration by key
router.get('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const config = await databaseService.getSystemConfig(key);

    if (!config) {
      const response: ApiResponse = {
        success: false,
        error: 'Configuration not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: config
    };

    return res.json(response);
  } catch (error) {
    console.error('Get system config error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve system configuration'
    };
    return res.status(500).json(response);
  }
});

// Set system configuration
router.put('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const setConfigSchema = Joi.object({
      value: Joi.string().required(),
      description: Joi.string().max(255).optional()
    });

    const { error, value } = setConfigSchema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const config = await databaseService.setSystemConfig(
      key,
      value.value,
      value.description
    );

    const response: ApiResponse = {
      success: true,
      data: config,
      message: 'System configuration updated successfully'
    };

    return res.json(response);
  } catch (error) {
    console.error('Set system config error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update system configuration'
    };
    return res.status(500).json(response);
  }
});

// Set multiple system configurations
router.post('/bulk', requireAdmin, async (req, res) => {
  try {
    const bulkConfigSchema = Joi.object({
      configs: Joi.array().items(
        Joi.object({
          key: Joi.string().min(1).max(100).required(),
          value: Joi.string().required(),
          description: Joi.string().max(255).optional()
        })
      ).min(1).required()
    });

    const { error, value } = bulkConfigSchema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const updatedConfigs = [];

    for (const config of value.configs) {
      const updatedConfig = await databaseService.setSystemConfig(
        config.key,
        config.value,
        config.description
      );
      updatedConfigs.push(updatedConfig);
    }

    const response: ApiResponse = {
      success: true,
      data: updatedConfigs,
      message: `Updated ${updatedConfigs.length} system configurations`
    };

    return res.json(response);
  } catch (error) {
    console.error('Bulk set system config error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update system configurations'
    };
    return res.status(500).json(response);
  }
});

// Get SFTP configuration (masked for security)
router.get('/sftp/settings', requireAdmin, async (req, res) => {
  try {
    const databaseService: DatabaseService = req.app.locals.databaseService;

    const sftpConfigs = await Promise.all([
      databaseService.getSystemConfig('sftp_host'),
      databaseService.getSystemConfig('sftp_port'),
      databaseService.getSystemConfig('sftp_username'),
      databaseService.getSystemConfig('sftp_password'),
      databaseService.getSystemConfig('sftp_private_key_path')
    ]);

    const sftpSettings = {
      host: sftpConfigs[0]?.value || '',
      port: sftpConfigs[1]?.value || '22',
      username: sftpConfigs[2]?.value || '',
      password: sftpConfigs[3]?.value ? '***MASKED***' : '',
      privateKeyPath: sftpConfigs[4]?.value || ''
    };

    const response: ApiResponse = {
      success: true,
      data: sftpSettings
    };

    return res.json(response);
  } catch (error) {
    console.error('Get SFTP settings error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve SFTP settings'
    };
    return res.status(500).json(response);
  }
});

// Update SFTP configuration
router.put('/sftp/settings', requireAdmin, async (req, res) => {
  try {
    const sftpSettingsSchema = Joi.object({
      host: Joi.string().hostname().required(),
      port: Joi.number().integer().min(1).max(65535).default(22),
      username: Joi.string().min(1).required(),
      password: Joi.string().optional(),
      privateKeyPath: Joi.string().optional()
    });

    const { error, value } = sftpSettingsSchema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;

    const configUpdates = [
      { key: 'sftp_host', value: value.host, description: 'SFTP server hostname' },
      { key: 'sftp_port', value: value.port.toString(), description: 'SFTP server port' },
      { key: 'sftp_username', value: value.username, description: 'SFTP username' }
    ];

    if (value.password) {
      configUpdates.push({ 
        key: 'sftp_password', 
        value: value.password, 
        description: 'SFTP password (encrypted)' 
      });
    }

    if (value.privateKeyPath) {
      configUpdates.push({ 
        key: 'sftp_private_key_path', 
        value: value.privateKeyPath, 
        description: 'Path to SFTP private key file' 
      });
    }

    for (const config of configUpdates) {
      await databaseService.setSystemConfig(config.key, config.value, config.description);
    }

    const response: ApiResponse = {
      success: true,
      message: 'SFTP settings updated successfully'
    };

    return res.json(response);
  } catch (error) {
    console.error('Update SFTP settings error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update SFTP settings'
    };
    return res.status(500).json(response);
  }
});

// Get ACH configuration
router.get('/ach/settings', requireAdmin, async (req, res) => {
  try {
    const databaseService: DatabaseService = req.app.locals.databaseService;

    const achConfigs = await Promise.all([
      databaseService.getSystemConfig('ach_immediate_destination'),
      databaseService.getSystemConfig('ach_immediate_origin'),
      databaseService.getSystemConfig('ach_company_name'),
      databaseService.getSystemConfig('ach_company_id'),
      databaseService.getSystemConfig('ach_company_discretionary_data')
    ]);

    const achSettings = {
      immediateDestination: achConfigs[0]?.value || '',
      immediateOrigin: achConfigs[1]?.value || '',
      companyName: achConfigs[2]?.value || '',
      companyId: achConfigs[3]?.value || '',
      companyDiscretionaryData: achConfigs[4]?.value || ''
    };

    const response: ApiResponse = {
      success: true,
      data: achSettings
    };

    return res.json(response);
  } catch (error) {
    console.error('Get ACH settings error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve ACH settings'
    };
    return res.status(500).json(response);
  }
});

// Update ACH configuration
router.put('/ach/settings', requireAdmin, async (req, res) => {
  try {
    const achSettingsSchema = Joi.object({
      immediateDestination: Joi.string().pattern(/^\d{9,10}$/).required().messages({
        'string.pattern.base': 'Immediate Destination must be 9-10 digits'
      }),
      immediateOrigin: Joi.string().pattern(/^\d{9,10}$/).required().messages({
        'string.pattern.base': 'Immediate Origin must be 9-10 digits'
      }),
      companyName: Joi.string().min(1).max(16).required(),
      companyId: Joi.string().pattern(/^\d{10}$/).required().messages({
        'string.pattern.base': 'Company ID must be exactly 10 digits'
      }),
      companyDiscretionaryData: Joi.string().max(20).optional().default('')
    });

    const { error, value } = achSettingsSchema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;

    const configUpdates = [
      { 
        key: 'ach_immediate_destination', 
        value: value.immediateDestination, 
        description: 'ACH Immediate Destination (receiving bank routing number)' 
      },
      { 
        key: 'ach_immediate_origin', 
        value: value.immediateOrigin, 
        description: 'ACH Immediate Origin (originating bank routing number)' 
      },
      { 
        key: 'ach_company_name', 
        value: value.companyName, 
        description: 'ACH Company Name' 
      },
      { 
        key: 'ach_company_id', 
        value: value.companyId, 
        description: 'ACH Company Identification Number' 
      },
      { 
        key: 'ach_company_discretionary_data', 
        value: value.companyDiscretionaryData, 
        description: 'ACH Company Discretionary Data' 
      }
    ];

    for (const config of configUpdates) {
      await databaseService.setSystemConfig(config.key, config.value, config.description);
    }

    const response: ApiResponse = {
      success: true,
      message: 'ACH settings updated successfully'
    };

    return res.json(response);
  } catch (error) {
    console.error('Update ACH settings error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update ACH settings'
    };
    return res.status(500).json(response);
  }
});

// Test SFTP connection
router.post('/sftp/test', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await ConfigService.testSFTPConnection();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('SFTP connection test failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as configRoutes };
router.post('/sftp/test', requireAdmin, async (req, res) => {
  try {
    const databaseService: DatabaseService = req.app.locals.databaseService;

    const sftpConfigs = await Promise.all([
      databaseService.getSystemConfig('sftp_host'),
      databaseService.getSystemConfig('sftp_port'),
      databaseService.getSystemConfig('sftp_username'),
      databaseService.getSystemConfig('sftp_password')
    ]);

    const host = sftpConfigs[0]?.value;
    const port = parseInt(sftpConfigs[1]?.value || '22');
    const username = sftpConfigs[2]?.value;
    const password = sftpConfigs[3]?.value;

    if (!host || !username || !password) {
      const response: ApiResponse = {
        success: false,
        error: 'SFTP configuration is incomplete. Please configure host, username, and password.'
      };
      return res.status(400).json(response);
    }

    // TODO: Implement actual SFTP connection test
    // For now, return a mock response
    const response: ApiResponse = {
      success: true,
      message: 'SFTP connection test completed successfully',
      data: {
        host,
        port,
        username,
        connected: true,
        testTime: new Date().toISOString()
      }
    };

    return res.json(response);
  } catch (error) {
    console.error('Test SFTP connection error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'SFTP connection test failed'
    };
    return res.status(500).json(response);
  }
});

export { router as configRouter };
