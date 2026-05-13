import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import transactionRoutes from './routes/transactions.js';
import savingsRoutes from './routes/savings.js';
import airtimeRoutes from './routes/airtime.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';

const app = express();

// ── Security middleware ─────────────────────────────
app.set('trust proxy', 1);
app.use(helmet());

// ── CORS FIX (IMPORTANT) ─────────────────────────────
app.use(cors({
  origin: "https://www.kuditrackapp.site",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// handle preflight requests
app.options("*", cors());

// ── Middleware ───────────────────────────────────────
app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));

// ── Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/airtime', airtimeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// health check
app.get('/api/health', (_, res) =>
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    time: new Date()
  })
);

// ── Error handler ────────────────────────────────────
app.use(errorHandler);

// ── DB + SERVER START ────────────────────────────────
const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });