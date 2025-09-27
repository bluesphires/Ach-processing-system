import { Router } from 'express';

const router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth routes are working' });
});

// Login endpoint
router.post('/login', async (req, res) => {
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
      
      res.json({
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
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
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
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as authRoutes };

