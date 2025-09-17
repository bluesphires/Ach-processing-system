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