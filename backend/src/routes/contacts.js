import express from 'express';
import {
  getAllContacts,
  getContactById,
  markContactAsRead,
  respondToContact,
  deleteContact,
  getContactStats
} from '../controllers/contactController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Contact routes
router.get('/', getAllContacts);
router.get('/stats', getContactStats);
router.get('/:id', getContactById);
router.patch('/:id/read', markContactAsRead);
router.patch('/:id/respond', respondToContact);
router.delete('/:id', deleteContact);

export default router;
