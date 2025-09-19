import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { achRoutes } from './routes/ach';
import { configRoutes } from './routes/config';
import { reportRoutes } from './routes/reports';


import morgan from 'morgan';
import dotenv from 'dotenv';
import { DatabaseService } from './services/databaseService';
import { EncryptionService } from './services/encryptionService';
import { BusinessDayService } from './services/businessDayService';
import { NACHAService } from './services/nachaService';
import { authRouter } from './routes/auth';
import { transactionRouter } from './routes/transactions';
import { nachaRouter } from './routes/nacha';
import { configRouter } from './routes/config';
import { holidayRouter } from './routes/holidays';
import { logUnauthorizedAccess, logOrganizationActivity } from './middleware/logging';
import { organizationRouter } from './routes/organizations';
import { ApiResponse } from './types';

// Load environment variables

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ENCRYPTION_KEY',
  'JWT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ach', achRoutes);
app.use('/api/config', configRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add logging middleware
app.use(logUnauthorizedAccess);
app.use(logOrganizationActivity);

// Initialize services
const databaseService = new DatabaseService(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const encryptionService = new EncryptionService(
  process.env.ENCRYPTION_KEY!
);

const businessDayService = new BusinessDayService();

const nachaService = new NACHAService({
  immediateDestination: process.env.ACH_IMMEDIATE_DESTINATION!,
  immediateOrigin: process.env.ACH_IMMEDIATE_ORIGIN!,
  companyName: process.env.ACH_COMPANY_NAME!,
  companyId: process.env.ACH_COMPANY_ID!,
  originatingDFI: process.env.ACH_IMMEDIATE_ORIGIN!
}, encryptionService);

// Make services available to routes
app.locals.databaseService = databaseService;
app.locals.encryptionService = encryptionService;
app.locals.businessDayService = businessDayService;
app.locals.nachaService = nachaService;

// Health check endpoint
app.get('/health', (_req, res) => {
  const response: ApiResponse = {
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

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/organizations', organizationRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/nacha', nachaRouter);
app.use('/api/config', configRouter);
app.use('/api/holidays', holidayRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  
  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An error occurred while processing your request'
      : err.message
  };
  
  res.status(500).json(response);
});

// 404 handler
app.use('*', (_req, res) => {
  const response: ApiResponse = {
    success: false,
    error: 'Endpoint not found'
  };
  res.status(404).json(response);
});

// Start server
app.listen(PORT, () => {
  console.log(`ACH Processing System API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;