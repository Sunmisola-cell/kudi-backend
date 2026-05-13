/**
 * Global Express error handler.
 * All async route handlers should call next(err) on failure,
 * or use the asyncHandler wrapper below.
 */
export function errorHandler(err, req, res, _next) {
  // Log in dev; hide internals in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error]', err);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({ error: 'Validation failed', errors });
  }

  // Mongoose duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `${field} is already taken` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ error: 'Invalid token' });
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ error: 'Token expired' });

  const status = err.status || err.statusCode || 500;
  const message = (process.env.NODE_ENV === 'production' && status === 500)
    ? 'Internal server error'
    : err.message;

  res.status(status).json({ error: message });
}

/**
 * Wraps an async route handler so errors are forwarded to errorHandler
 * without needing try/catch in every controller.
 *
 * Usage: router.post('/foo', asyncHandler(myController))
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
