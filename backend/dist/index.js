"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const databaseService_1 = require("./services/databaseService");
const encryptionService_1 = require("./services/encryptionService");
const businessDayService_1 = require("./services/businessDayService");
const nachaService_1 = require("./services/nachaService");
const auth_1 = require("./routes/auth");
const transactions_1 = require("./routes/transactions");
const nacha_1 = require("./routes/nacha");
const config_1 = require("./routes/config");
const holidays_1 = require("./routes/holidays");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
const databaseService = new databaseService_1.DatabaseService(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const encryptionService = new encryptionService_1.EncryptionService(process.env.ENCRYPTION_KEY);
const businessDayService = new businessDayService_1.BusinessDayService();
const nachaService = new nachaService_1.NACHAService({
    immediateDestination: process.env.ACH_IMMEDIATE_DESTINATION,
    immediateOrigin: process.env.ACH_IMMEDIATE_ORIGIN,
    companyName: process.env.ACH_COMPANY_NAME,
    companyId: process.env.ACH_COMPANY_ID,
    originatingDFI: process.env.ACH_IMMEDIATE_ORIGIN
});
app.locals.databaseService = databaseService;
app.locals.encryptionService = encryptionService;
app.locals.businessDayService = businessDayService;
app.locals.nachaService = nachaService;
app.get('/health', (_req, res) => {
    const response = {
        success: true,
        message: 'ACH Processing System API is running',
        data: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        }
    };
    res.json(response);
});
app.use('/api/auth', auth_1.authRouter);
app.use('/api/transactions', transactions_1.transactionRouter);
app.use('/api/nacha', nacha_1.nachaRouter);
app.use('/api/config', config_1.configRouter);
app.use('/api/holidays', holidays_1.holidayRouter);
app.use((err, req, res, _next) => {
    console.error('Error:', err);
    const response = {
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'An error occurred while processing your request'
            : err.message
    };
    res.status(500).json(response);
});
app.use('*', (_req, res) => {
    const response = {
        success: false,
        error: 'Endpoint not found'
    };
    res.status(404).json(response);
});
app.listen(PORT, () => {
    console.log(`ACH Processing System API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map