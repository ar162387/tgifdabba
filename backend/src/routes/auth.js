import express from 'express';
import { login, getMe, updateProfile, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validateLogin, validateProfileUpdate } from '../middleware/validate.js';

const router = express.Router();

// Public routes
router.post('/login', authLimiter, validateLogin, login);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.patch('/profile', authenticateToken, validateProfileUpdate, updateProfile);
router.post('/logout', authenticateToken, logout);

export default router;
