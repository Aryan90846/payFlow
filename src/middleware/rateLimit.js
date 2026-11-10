import rateLimit from 'express-rate-limit';

function jsonHandler(req, res) {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
  });
}

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: jsonHandler,
  standardHeaders: true,
});

export const passwordRecoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  handler: jsonHandler,
  standardHeaders: true,
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  handler: jsonHandler,
  standardHeaders: true,
});
