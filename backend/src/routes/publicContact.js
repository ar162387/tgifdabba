import express from 'express';
import { submitContact } from '../controllers/publicContactController.js';

const router = express.Router();

// Public contact route (no authentication required)
router.post('/', submitContact);

export default router;
