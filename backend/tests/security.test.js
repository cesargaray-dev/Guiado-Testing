'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const db = require('../src/db');
const { generateTokens } = require('../src/auth/jwt');

describe('Security Basics and Negative Behavior (Section 9)', () => {
  let userToken;

  beforeEach(() => {
    db.reset();
    const user = db.createUser({
      email: 'security_test@example.test',
      password: 'Password123!'
    });
    const tokens = generateTokens(user);
    userToken = tokens.accessToken;
  });

  test('handles SQL-injection looking strings safely without interpretation', async () => {
    const sqliPayload = "' OR '1'='1";
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: sqliPayload });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(sqliPayload);

    // Verify task is retrieved as plain string
    const getRes = await request(app)
      .get(`/api/v1/tasks/${res.body.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe(sqliPayload);
  });

  test('stores HTML/XSS markup safely as raw text without execution or alteration', async () => {
    const xssPayload = '<script>alert(1)</script>';
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: xssPayload });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(xssPayload);
  });

  test('rejects oversized JSON payloads (Unrestricted Resource Consumption defense)', async () => {
    // Exceeds 10kb limit set on express.json
    const oversizedTitle = 'x'.repeat(20 * 1024);
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: oversizedTitle });

    expect([400, 413]).toContain(res.status);
  });

  test('rate limits repeated login attempts', async () => {
    // Send 12 rapid failed login attempts to trigger 429
    let lastStatus = 200;
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.test', password: 'WrongPassword!' });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
