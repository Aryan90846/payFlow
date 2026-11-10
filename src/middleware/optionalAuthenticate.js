import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

// Lets public plan browsing also recognise a logged-in admin
// (so ?all=true works) without requiring a token.
export async function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(header.slice(7), env.jwtSecret);
    req.user = await User.findById(decoded.sub);
  } catch {
    req.user = undefined;
  }
  return next();
}
