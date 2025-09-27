// Load environment variables FIRST, before any other imports
import * as dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import * as express from 'express';
import * as cors from 'cors';

const app = express.default();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors.default({
  origin: [
    'http://localhost:3000',
    'http://192.168.18.196:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.default.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Backend is working' });
});

// Auth routes
app.get('/api/auth/test', (req, res) => {
  res.json({ success: true, message: 'Auth routes are working' });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
      success: false,
      error: 'Email and password are required'
      });
    }

    // Simple hardcoded admin check for now
    if (email === 'admin@achprocessing.com' && password === 'admin123') {
      const token = 'fake-jwt-token-for-testing';
      
      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: '123fd40c-6378-4480-8074-3e3c260db42e',
            email: 'admin@achprocessing.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin'
          }
        }
      });
    } else {
      return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get current user profile
app.get('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
      success: false,
      error: 'Access token required'
      });
    }

    // Simple token check for now
    if (token === 'fake-jwt-token-for-testing') {
      res.json({
        success: true,
        data: {
          id: '123fd40c-6378-4480-8074-3e3c260db42e',
          email: 'admin@achprocessing.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Transaction endpoints
app.post('/api/transactions/separate', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token !== 'fake-jwt-token-for-testing') {
      return res.status(401).json({
      success: false,
      error: 'Access token required'
      });
    }

    // Mock response for now
    return res.json({
      success: true,
      data: {
        id: 'mock-transaction-group-id',
        drEntry: {
          id: 'mock-dr-entry-id',
          routingNumber: req.body.drRoutingNumber,
          accountNumber: req.body.drAccountNumber,
          entryId: req.body.drId,
          name: req.body.drName,
          amount: req.body.amount,
          effectiveDate: req.body.drEffectiveDate,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        crEntry: {
          id: 'mock-cr-entry-id',
          routingNumber: req.body.crRoutingNumber,
          accountNumber: req.body.crAccountNumber,
          entryId: req.body.crId,
          name: req.body.crName,
          amount: req.body.amount,
          effectiveDate: req.body.crEffectiveDate,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token !== 'fake-jwt-token-for-testing') {
      return res.status(401).json({
      success: false,
      error: 'Access token required'
      });
    }

    // Mock response for now
    res.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transaction stats
app.get('/api/transactions/stats/summary', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token !== 'fake-jwt-token-for-testing') {
      return res.status(401).json({
      success: false,
      error: 'Access token required'
      });
    }

    // Mock response for now
    return res.json({
      success: true,
      data: {
        totalTransactions: 0,
        pendingTransactions: 0,
        processedTransactions: 0,
        failedTransactions: 0,
        totalAmount: 0
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get NACHA files
app.get('/api/nacha/files', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token !== 'fake-jwt-token-for-testing') {
      return res.status(401).json({
      success: false,
      error: 'Access token required'
      });
    }

    // Mock response for now
    res.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get federal holidays
app.get('/api/holidays', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token !== 'fake-jwt-token-for-testing') {
      return res.status(401).json({
      success: false,
      error: 'Access token required'
      });
    }

    // Mock response for now
    res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get system config
app.get('/api/config', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token !== 'fake-jwt-token-for-testing') {
      return res.status(401).json({
      success: false,
      error: 'Access token required'
      });
    }

    // Mock response for now
    res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`ACH Processing System API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

