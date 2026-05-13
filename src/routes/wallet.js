import express from 'express';
import { asyncHandler }      from '../middleware/errorHandler.js';
import { transactionLimiter } from '../middleware/rateLimiter.js';
import { requireAuth }       from '../middleware/auth.js';
import { validate }          from '../middleware/validate.js';
import { amountSchema, transferSchema, pinSchema } from '../validators/index.js';
import { getWallet, fund, transfer, setPin } from '../controllers/walletController.js';

const router = express.Router();

router.get( '/',        requireAuth,                                         asyncHandler(getWallet));
router.post('/fund',    requireAuth, transactionLimiter, validate(amountSchema),   asyncHandler(fund));
router.post('/transfer',requireAuth, transactionLimiter, validate(transferSchema), asyncHandler(transfer));
router.post('/set-pin', requireAuth, validate(pinSchema),                    asyncHandler(setPin));

export default router;
