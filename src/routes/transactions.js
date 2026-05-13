import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth }  from '../middleware/auth.js';
import { listTransactions } from '../controllers/transactionController.js';

const router = express.Router();

router.get('/', requireAuth, asyncHandler(listTransactions));

export default router;
