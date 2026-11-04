'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateTokens, verifyRefreshToken, authenticate } = require('../auth/jwt');
const { validatePassword } = require('../tasks/validation');

// Rate limiter tracking for sensitive business flow (OWASP Top 10)
const loginAttempts = new Map(); // ip -> { count, resetTime }

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxAttempts = 10;

  let record = loginAttempts.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
    loginAttempts.set(ip, record);
  }

  record.count++;
  if (record.count > maxAttempts) {
    return res.status(429).json({
      error: 'Too many login attempts. Please try again after 60 seconds.'
    });
  }
  next();
}

// Register
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  try {
    validatePassword(password);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    const user = db.createUser({ email, password });
    const tokens = generateTokens(user);
    return res.status(201).json({
      user: { id: user.id, email: user.email },
      ...tokens
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'User already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Login
router.post('/login', loginRateLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const tokens = generateTokens(user);
  return res.json({
    user: { id: user.id, email: user.email },
    ...tokens
  });
});

// Refresh token rotation & reuse detection
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = db.findUserById(decoded.sub);
    if (!user || !user.refreshTokens.has(refreshToken)) {
      // Possible token reuse attack detected! Revoke all tokens for this user!
      if (user) {
        db.revokeAllUserTokens(user.id);
      }
      return res.status(403).json({ error: 'Invalid refresh token or token reuse detected.' });
    }

    // Rotate refresh token
    db.removeRefreshToken(user.id, refreshToken);
    const tokens = generateTokens(user);

    return res.json(tokens);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
});

// Logout single session
router.post('/logout', authenticate, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    db.removeRefreshToken(req.user.id, refreshToken);
  }
  return res.json({ message: 'Logged out successfully.' });
});

// Logout all sessions
router.post('/logout-all', authenticate, (req, res) => {
  db.revokeAllUserTokens(req.user.id);
  return res.json({ message: 'All sessions terminated successfully.' });
});

module.exports = router;

