'use strict';

const jwt = require('jsonwebtoken');
const db = require('../db');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret-key-12345';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret-key-67890';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

function generateTokens(user) {
  const payload = { sub: user.id, email: user.email };
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  // Add a unique jti (JWT ID) so every rotated refresh token is distinct even in the same second
  const refreshPayload = { ...payload, jti: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
  const refreshToken = jwt.sign(refreshPayload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

  db.addRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  if (db.isTokenRevoked(token)) {
    throw new Error('Token has been revoked (reuse detected or logged out)');
  }
  return jwt.verify(token, REFRESH_SECRET);
}

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Bearer token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired.' });
    }
    return res.status(401).json({ error: 'Invalid access token.' });
  }
}

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  authenticate,
  ACCESS_SECRET,
  REFRESH_SECRET
};
