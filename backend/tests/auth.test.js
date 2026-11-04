'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const db = require('../src/db');
const { verifyAccessToken } = require('../src/auth/jwt');

describe('Auth & Session Security (Section 9)', () => {
  beforeEach(() => {
    db.reset();
  });

  test('registers a user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user@example.test', password: 'ValidPassword123!' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe('user@example.test');
  });

  test('rejects duplicate email registration (409 Conflict)', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@example.test', password: 'ValidPassword123!' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@example.test', password: 'ValidPassword123!' });
    expect(res.status).toBe(409);
  });

  test('authenticates user and returns JWT token pair', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'login@example.test', password: 'ValidPassword123!' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.test', password: 'ValidPassword123!' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  test('rotates refresh token upon refresh request', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'refresh@example.test', password: 'ValidPassword123!' });

    const initialRefreshToken = regRes.body.refreshToken;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();
    expect(refreshRes.body.refreshToken).toBeDefined();
    expect(refreshRes.body.refreshToken).not.toBe(initialRefreshToken);

    // Reuse detection: Attempting to use the old refresh token must be rejected!
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRefreshToken });
    expect([401, 403]).toContain(reuseRes.status);
  });

  test('logout revokes refresh token', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'logout@example.test', password: 'ValidPassword123!' });

    const { accessToken, refreshToken } = regRes.body;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    // Refresh should now fail
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect([401, 403]).toContain(refreshRes.status);
  });
});

