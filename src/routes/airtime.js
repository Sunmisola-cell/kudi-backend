import express from 'express';
import { asyncHandler }       from '../middleware/errorHandler.js';
import { transactionLimiter } from '../middleware/rateLimiter.js';
import { requireAuth }        from '../middleware/auth.js';
import { validate }           from '../middleware/validate.js';
import { airtimeSchema }      from '../validators/index.js';
import { buyAirtime }         from '../controllers/airtimeController.js';

const router = express.Router();

router.post('/purchase', requireAuth, transactionLimiter, validate(airtimeSchema), asyncHandler(buyAirtime));

export default router;
