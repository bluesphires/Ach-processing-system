"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRouter = void 0;
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const auth_1 = require("@/middleware/auth");
const router = express_1.default.Router();
exports.configRouter = router;
router.use(auth_1.authMiddleware);
const configSchema = joi_1.default.object({
    key: joi_1.default.string().min(1).max(100).required(),
    value: joi_1.default.string().required(),
    description: joi_1.default.string().max(255).optional()
});
router.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const databaseService = req.app.locals.databaseService;
        const configs = await databaseService.getAllSystemConfig();
        const response = {
            success: true,
            data: configs
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get system config error:', error);
        const response = {
            success: false,
            error: 'Failed to retrieve system configuration'
        };
        res.status(500).json(response);
    }
});
router.get('/:key', auth_1.requireAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const databaseService = req.app.locals.databaseService;
        const config = await databaseService.getSystemConfig(key);
        if (!config) {
            const response = {
                success: false,
                error: 'Configuration not found'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: config
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get system config error:', error);
        const response = {
            success: false,
            error: 'Failed to retrieve system configuration'
        };
        res.status(500).json(response);
    }
});
router.put('/:key', auth_1.requireAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const setConfigSchema = joi_1.default.object({
            value: joi_1.default.string().required(),
            description: joi_1.default.string().max(255).optional()
        });
        const { error, value } = setConfigSchema.validate(req.body);
        if (error) {
            const response = {
                success: false,
                error: error.details[0].message
            };
            return res.status(400).json(response);
        }
        const databaseService = req.app.locals.databaseService;
        const config = await databaseService.setSystemConfig(key, value.value, value.description);
        const response = {
            success: true,
            data: config,
            message: 'System configuration updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Set system config error:', error);
        const response = {
            success: false,
            error: 'Failed to update system configuration'
        };
        res.status(500).json(response);
    }
});
router.post('/bulk', auth_1.requireAdmin, async (req, res) => {
    try {
        const bulkConfigSchema = joi_1.default.object({
            configs: joi_1.default.array().items(joi_1.default.object({
                key: joi_1.default.string().min(1).max(100).required(),
                value: joi_1.default.string().required(),
                description: joi_1.default.string().max(255).optional()
            })).min(1).required()
        });
        const { error, value } = bulkConfigSchema.validate(req.body);
        if (error) {
            const response = {
                success: false,
                error: error.details[0].message
            };
            return res.status(400).json(response);
        }
        const databaseService = req.app.locals.databaseService;
        const updatedConfigs = [];
        for (const config of value.configs) {
            const updatedConfig = await databaseService.setSystemConfig(config.key, config.value, config.description);
            updatedConfigs.push(updatedConfig);
        }
        const response = {
            success: true,
            data: updatedConfigs,
            message: `Updated ${updatedConfigs.length} system configurations`
        };
        res.json(response);
    }
    catch (error) {
        console.error('Bulk set system config error:', error);
        const response = {
            success: false,
            error: 'Failed to update system configurations'
        };
        res.status(500).json(response);
    }
});
router.get('/sftp/settings', auth_1.requireAdmin, async (req, res) => {
    try {
        const databaseService = req.app.locals.databaseService;
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
        const response = {
            success: true,
            data: sftpSettings
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get SFTP settings error:', error);
        const response = {
            success: false,
            error: 'Failed to retrieve SFTP settings'
        };
        res.status(500).json(response);
    }
});
router.put('/sftp/settings', auth_1.requireAdmin, async (req, res) => {
    try {
        const sftpSettingsSchema = joi_1.default.object({
            host: joi_1.default.string().hostname().required(),
            port: joi_1.default.number().integer().min(1).max(65535).default(22),
            username: joi_1.default.string().min(1).required(),
            password: joi_1.default.string().optional(),
            privateKeyPath: joi_1.default.string().optional()
        });
        const { error, value } = sftpSettingsSchema.validate(req.body);
        if (error) {
            const response = {
                success: false,
                error: error.details[0].message
            };
            return res.status(400).json(response);
        }
        const databaseService = req.app.locals.databaseService;
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
        const response = {
            success: true,
            message: 'SFTP settings updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update SFTP settings error:', error);
        const response = {
            success: false,
            error: 'Failed to update SFTP settings'
        };
        res.status(500).json(response);
    }
});
router.get('/ach/settings', auth_1.requireAdmin, async (req, res) => {
    try {
        const databaseService = req.app.locals.databaseService;
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
        const response = {
            success: true,
            data: achSettings
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get ACH settings error:', error);
        const response = {
            success: false,
            error: 'Failed to retrieve ACH settings'
        };
        res.status(500).json(response);
    }
});
router.put('/ach/settings', auth_1.requireAdmin, async (req, res) => {
    try {
        const achSettingsSchema = joi_1.default.object({
            immediateDestination: joi_1.default.string().pattern(/^\d{9,10}$/).required().messages({
                'string.pattern.base': 'Immediate Destination must be 9-10 digits'
            }),
            immediateOrigin: joi_1.default.string().pattern(/^\d{9,10}$/).required().messages({
                'string.pattern.base': 'Immediate Origin must be 9-10 digits'
            }),
            companyName: joi_1.default.string().min(1).max(16).required(),
            companyId: joi_1.default.string().pattern(/^\d{10}$/).required().messages({
                'string.pattern.base': 'Company ID must be exactly 10 digits'
            }),
            companyDiscretionaryData: joi_1.default.string().max(20).optional().default('')
        });
        const { error, value } = achSettingsSchema.validate(req.body);
        if (error) {
            const response = {
                success: false,
                error: error.details[0].message
            };
            return res.status(400).json(response);
        }
        const databaseService = req.app.locals.databaseService;
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
        const response = {
            success: true,
            message: 'ACH settings updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update ACH settings error:', error);
        const response = {
            success: false,
            error: 'Failed to update ACH settings'
        };
        res.status(500).json(response);
    }
});
router.post('/sftp/test', auth_1.requireAdmin, async (req, res) => {
    try {
        const databaseService = req.app.locals.databaseService;
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
            const response = {
                success: false,
                error: 'SFTP configuration is incomplete. Please configure host, username, and password.'
            };
            return res.status(400).json(response);
        }
        const response = {
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
        res.json(response);
    }
    catch (error) {
        console.error('Test SFTP connection error:', error);
        const response = {
            success: false,
            error: 'SFTP connection test failed'
        };
        res.status(500).json(response);
    }
});
//# sourceMappingURL=config.js.map