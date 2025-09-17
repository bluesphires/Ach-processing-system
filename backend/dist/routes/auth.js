"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const types_1 = require("@/types");
const auth_1 = require("@/middleware/auth");
const router = express_1.default.Router();
exports.authRouter = router;
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
    name: joi_1.default.string().min(2).required(),
    role: joi_1.default.string().valid(...Object.values(types_1.UserRole)).optional().default(types_1.UserRole.OPERATOR)
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
router.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            const response = {
                success: false,
                error: error.details[0].message
            };
            return res.status(400).json(response);
        }
        const databaseService = req.app.locals.databaseService;
        const { email, password, name, role } = value;
        const existingUser = await databaseService.getUserByEmail(email);
        if (existingUser) {
            const response = {
                success: false,
                error: 'User with this email already exists'
            };
            return res.status(400).json(response);
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const newUser = await databaseService.createUser({
            email,
            password: hashedPassword,
            name,
            role,
            active: true
        });
        const token = jsonwebtoken_1.default.sign({ userId: newUser.id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
        const response = {
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
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Registration error:', error);
        const response = {
            success: false,
            error: 'Failed to register user'
        };
        res.status(500).json(response);
    }
});
router.post('/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            const response = {
                success: false,
                error: error.details[0].message
            };
            return res.status(400).json(response);
        }
        const databaseService = req.app.locals.databaseService;
        const { email, password } = value;
        const user = await databaseService.getUserByEmail(email);
        if (!user || !user.active) {
            const response = {
                success: false,
                error: 'Invalid email or password'
            };
            return res.status(401).json(response);
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            const response = {
                success: false,
                error: 'Invalid email or password'
            };
            return res.status(401).json(response);
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
        const response = {
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
        res.json(response);
    }
    catch (error) {
        console.error('Login error:', error);
        const response = {
            success: false,
            error: 'Failed to login'
        };
        res.status(500).json(response);
    }
});
router.get('/profile', auth_1.authMiddleware, async (req, res) => {
    try {
        const databaseService = req.app.locals.databaseService;
        const userId = req.user.userId;
        const user = await databaseService.getUserById(userId);
        if (!user) {
            const response = {
                success: false,
                error: 'User not found'
            };
            return res.status(404).json(response);
        }
        const response = {
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
        res.json(response);
    }
    catch (error) {
        console.error('Profile error:', error);
        const response = {
            success: false,
            error: 'Failed to get user profile'
        };
        res.status(500).json(response);
    }
});
router.put('/profile', auth_1.authMiddleware, async (req, res) => {
    try {
        const updateSchema = joi_1.default.object({
            name: joi_1.default.string().min(2).optional(),
            email: joi_1.default.string().email().optional()
        });
        const { error, value } = updateSchema.validate(req.body);
        if (error) {
            const response = {
                success: false,
                error: error.details[0].message
            };
            return res.status(400).json(response);
        }
        const databaseService = req.app.locals.databaseService;
        const userId = req.user.userId;
        if (value.email) {
            const existingUser = await databaseService.getUserByEmail(value.email);
            if (existingUser && existingUser.id !== userId) {
                const response = {
                    success: false,
                    error: 'Email is already taken'
                };
                return res.status(400).json(response);
            }
        }
        await databaseService.updateUser(userId, value);
        const response = {
            success: true,
            message: 'Profile updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Profile update error:', error);
        const response = {
            success: false,
            error: 'Failed to update profile'
        };
        res.status(500).json(response);
    }
});
router.put('/change-password', auth_1.authMiddleware, async (req, res) => {
    try {
        const changePasswordSchema = joi_1.default.object({
            currentPassword: joi_1.default.string().required(),
            newPassword: joi_1.default.string().min(8).required()
        });
        const { error, value } = changePasswordSchema.validate(req.body);
        if (error) {
            const response = {
                success: false,
                error: error.details[0].message
            };
            return res.status(400).json(response);
        }
        const databaseService = req.app.locals.databaseService;
        const userId = req.user.userId;
        const { currentPassword, newPassword } = value;
        const user = await databaseService.getUserById(userId);
        if (!user) {
            const response = {
                success: false,
                error: 'User not found'
            };
            return res.status(404).json(response);
        }
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValidPassword) {
            const response = {
                success: false,
                error: 'Current password is incorrect'
            };
            return res.status(401).json(response);
        }
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await databaseService.updateUser(userId, { password: hashedNewPassword });
        const response = {
            success: true,
            message: 'Password changed successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Change password error:', error);
        const response = {
            success: false,
            error: 'Failed to change password'
        };
        res.status(500).json(response);
    }
});
//# sourceMappingURL=auth.js.map