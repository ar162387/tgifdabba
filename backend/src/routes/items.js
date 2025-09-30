import express from 'express';
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  toggleItemStatus,
  checkItemUsage,
  bulkDeleteItems
} from '../controllers/itemController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateItem } from '../middleware/validate.js';
import { uploadSingleImage, handleUploadError } from '../middleware/upload.js';
import { realtimeLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Item routes
router.get('/', realtimeLimiter, getAllItems); // Use lenient rate limiter for frequent polling
router.get('/:id', getItemById);
router.get('/:id/usage', checkItemUsage);
router.post('/', uploadSingleImage, handleUploadError, validateItem, createItem);
router.post('/bulk-delete', bulkDeleteItems);
router.put('/:id', uploadSingleImage, handleUploadError, validateItem, updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/toggle-status', toggleItemStatus);

export default router;
