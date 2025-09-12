import express from 'express';
import {
  getAllDailyMenus,
  getDailyMenuByDay,
  createDailyMenu,
  updateDailyMenu,
  deleteDailyMenu,
  publishDailyMenu
} from '../controllers/dailyMenuController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateDailyMenu } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Daily menu routes
router.get('/', getAllDailyMenus);
router.get('/day/:day', getDailyMenuByDay);
router.post('/', validateDailyMenu, createDailyMenu);
router.put('/:id', validateDailyMenu, updateDailyMenu);
router.delete('/:id', deleteDailyMenu);
router.patch('/:id/publish', publishDailyMenu);

export default router;
