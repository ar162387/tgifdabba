import express from 'express';
import {
  getDailyMenuByDay,
  getAllDailyMenus
} from '../controllers/dailyMenuController.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/', getAllDailyMenus);
router.get('/day/:day', getDailyMenuByDay);

export default router;
