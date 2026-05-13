import express from 'express';
import { asyncHandler }       from '../middleware/errorHandler.js';
import { transactionLimiter } from '../middleware/rateLimiter.js';
import { requireAuth }        from '../middleware/auth.js';
import { validate }           from '../middleware/validate.js';
import {
  createSavingsSchema,
  savingsDepositSchema,
  savingsWithdrawSchema,
} from '../validators/index.js';
import {
  listGoals,
  createGoal,
  deposit,
  withdraw,
  deleteGoal,
} from '../controllers/savingsController.js';

const router = express.Router();

router.get('/',              requireAuth,                                              asyncHandler(listGoals));
router.post('/',             requireAuth, validate(createSavingsSchema),               asyncHandler(createGoal));
router.post('/:id/deposit',  requireAuth, transactionLimiter, validate(savingsDepositSchema),  asyncHandler(deposit));
router.post('/:id/withdraw', requireAuth, transactionLimiter, validate(savingsWithdrawSchema), asyncHandler(withdraw));
router.delete('/:id',        requireAuth,                                              asyncHandler(deleteGoal));

export default router;
