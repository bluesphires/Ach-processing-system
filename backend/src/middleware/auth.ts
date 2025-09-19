import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { AuthTokenPayload, UserRole } from '../types';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logger.error('JWT_SECRET environment variable not set');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt', { token: token.substring(0, 10) + '...' });
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', { 
        userId: req.user.userId, 
        role: req.user.role, 
        requiredRoles: roles 
      });
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });

import { UserRole, ApiResponse } from '@/types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Authentication middleware to verify JWT tokens
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. No token provided.'
      };
      res.status(401).json(response);
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid token.'
    };
    res.status(401).json(response);
  }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required.'
      };
      res.status(401).json(response);
      return;
    }

    if (!roles.includes(req.user.role)) {
      const response: ApiResponse = {
        success: false,
        error: 'Insufficient permissions.'
      };
      res.status(403).json(response);
      return;

    }

    next();
  };
};


export const requireAdmin = requireRole(['admin']);
export const requireOperator = requireRole(['admin', 'operator']);

// Export the authenticated request type for use in routes
export { AuthenticatedRequest };

/**
 * Admin only middleware
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Admin or Operator middleware
 */
export const requireOperator = requireRole(UserRole.ADMIN, UserRole.OPERATOR);

/**
 * Organization only middleware
 */
export const requireOrganization = requireRole(UserRole.ORGANIZATION);

/**
 * Organization or higher access middleware (for transaction submission)
 */
export const requireTransactionAccess = requireRole(UserRole.ADMIN, UserRole.OPERATOR, UserRole.ORGANIZATION);

/**
 * Internal access only (Admin/Operator) - excludes organizations
 */
export const requireInternal = requireRole(UserRole.ADMIN, UserRole.OPERATOR);
