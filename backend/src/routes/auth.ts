import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';
import { AuthTokenPayload } from '../types';
import Joi from 'joi';

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  role: Joi.string().valid('admin', 'operator', 'viewer').default('viewer')
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { email, password } = value;

    // Get user from database
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (dbError || !user) {
      logger.warn('Login attempt with invalid email', { email });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', { email, userId: user.id });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const tokenPayload: Omit<AuthTokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });

    logger.info('User logged in successfully', { userId: user.id, email });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      }
    });
  } catch (error: any) {
    logger.error('Login error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Register endpoint (admin only in production)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { email, password, firstName, lastName, role } = value;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, first_name, last_name, role')
      .single();

    if (createError) {
      throw createError;
    }

    logger.info('New user registered', { userId: newUser.id, email, role });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role
        }
      }
    });
  } catch (error: any) {
    logger.error('Registration error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token required'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify current token (even if expired)
    let decoded: AuthTokenPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        decoded = jwt.decode(token) as AuthTokenPayload;
      } else {
        return res.status(403).json({
          success: false,
          error: 'Invalid token'
        });
      }
    }

    // Generate new token
    const tokenPayload: Omit<AuthTokenPayload, 'iat' | 'exp'> = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    const newToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });

    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (error: any) {
    logger.error('Token refresh error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as authRoutes };
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import Joi from 'joi';
import { DatabaseService } from '@/services/databaseService';
import { User, UserRole, ApiResponse } from '@/types';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required(),
  role: Joi.string().valid(...Object.values(UserRole)).optional().default(UserRole.OPERATOR)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const { email, password, name, role } = value;

    // Check if user already exists
    const existingUser = await databaseService.getUserByEmail(email);
    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'User with this email already exists'
      };
      return res.status(400).json(response);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await databaseService.createUser({
      email,
      password: hashedPassword,
      name,
      role,
      active: true
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as SignOptions
    );

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          active: newUser.active
        },
        token
      },
      message: 'User registered successfully'
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to register user'
    };
    return res.status(500).json(response);
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const { email, password } = value;

    // Find user
    const user = await databaseService.getUserByEmail(email);
    if (!user || !user.active) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid email or password'
      };
      return res.status(401).json(response);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid email or password'
      };
      return res.status(401).json(response);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as SignOptions
    );

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          active: user.active
        },
        token
      },
      message: 'Login successful'
    };

    return res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to login'
    };
    return res.status(500).json(response);
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const databaseService: DatabaseService = req.app.locals.databaseService;
    const userId = req.user!.userId;

    const user = await databaseService.getUserById(userId);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };

    return res.json(response);
  } catch (error) {
    console.error('Profile error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get user profile'
    };
    return res.status(500).json(response);
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updateSchema = Joi.object({
      name: Joi.string().min(2).optional(),
      email: Joi.string().email().optional()
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const userId = req.user!.userId;

    // Check if email is already taken (if being updated)
    if (value.email) {
      const existingUser = await databaseService.getUserByEmail(value.email);
      if (existingUser && existingUser.id !== userId) {
        const response: ApiResponse = {
          success: false,
          error: 'Email is already taken'
        };
        return res.status(400).json(response);
      }
    }

    await databaseService.updateUser(userId, value);

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully'
    };

    return res.json(response);
  } catch (error) {
    console.error('Profile update error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update profile'
    };
    return res.status(500).json(response);
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const changePasswordSchema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required()
    });

    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }

    const databaseService: DatabaseService = req.app.locals.databaseService;
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = value;

    // Get user
    const user = await databaseService.getUserById(userId);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      const response: ApiResponse = {
        success: false,
        error: 'Current password is incorrect'
      };
      return res.status(401).json(response);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await databaseService.updateUser(userId, { password: hashedNewPassword });

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully'
    };

    return res.json(response);
  } catch (error) {
    console.error('Change password error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to change password'
    };
    return res.status(500).json(response);
  }
});

export { router as authRouter };
