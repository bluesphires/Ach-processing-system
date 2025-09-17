"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOperator = exports.requireAdmin = exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("@/types");
const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            const response = {
                success: false,
                error: 'Access denied. No token provided.'
            };
            res.status(401).json(response);
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        const response = {
            success: false,
            error: 'Invalid token.'
        };
        res.status(401).json(response);
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            const response = {
                success: false,
                error: 'Authentication required.'
            };
            res.status(401).json(response);
            return;
        }
        if (!roles.includes(req.user.role)) {
            const response = {
                success: false,
                error: 'Insufficient permissions.'
            };
            res.status(403).json(response);
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(types_1.UserRole.ADMIN);
exports.requireOperator = (0, exports.requireRole)(types_1.UserRole.ADMIN, types_1.UserRole.OPERATOR);
//# sourceMappingURL=auth.js.map