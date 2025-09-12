import express from 'express';
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  toggleItemStatus
} from '../controllers/itemController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateItem } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Item routes
router.get('/', getAllItems);
router.get('/:id', getItemById);
router.post('/', validateItem, createItem);
router.put('/:id', validateItem, updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/toggle-status', toggleItemStatus);

export default router;
