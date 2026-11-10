import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { badRequest, conflict, notFound, unauthorized } from '../utils/ApiError.js';
import {
  sendPasswordResetEmail,
  sendRegistrationEmail,
} from '../services/email.service.js';

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  // Role is never taken from the request body: everyone registers as customer.
  const existing = await User.findOne({ email });
  if (existing) throw conflict('An account with this email already exists');

  const user = await User.create({ name, email, password, role: 'customer' });
  await sendRegistrationEmail(user);
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user, token: signToken(user) },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw unauthorized('Account is no longer active');
  res.json({
    success: true,
    message: 'Login successful',
    data: { user: user.toJSON(), token: signToken(user) },
  });
}

export async function logout(req, res) {
  // JWTs are stateless, so logout means the client discards its token.
  // There is no server-side session to destroy in this design.
  res.json({ success: true, message: 'Logged out. Please discard your token.' });
}

export async function getMe(req, res) {
  res.json({ success: true, data: { user: req.user } });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // Same response whether or not the account exists, so attackers
  // cannot use this endpoint to discover registered emails.
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    if (env.nodeEnv !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[dev] Password reset token for ${email}: ${resetToken}`);
    }
    await sendPasswordResetEmail(user, resetToken);
  }
  res.json({
    success: true,
    message: 'If an account exists for this email, a reset token has been sent.',
  });
}

export async function resetPassword(req, res) {
  const { token, password } = req.body;
  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');
  if (!user) throw badRequest('Reset token is invalid or has expired');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Password reset successful. Please log in.' });
}

export async function getUserByIdForAdmin(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');
  res.json({ success: true, data: { user } });
}
