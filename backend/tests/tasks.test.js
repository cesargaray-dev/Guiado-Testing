'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const db = require('../src/db');
const { generateTokens } = require('../src/auth/jwt');

let userCounter = 0;

async function createTestUserAndGetToken() {
  userCounter++;
  const email = `testuser${userCounter}_${Date.now()}@example.test`;
  const user = db.createUser({
    email,
    password: 'Password123!'
  });
  const tokens = generateTokens(user);
  return tokens.accessToken;
}

async function createTask(token, title = 'Test Task') {
  const res = await request(app)
    .post('/api/v1/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({ title });
  return res.body.id;
}

describe('task API security and integration', () => {
  beforeEach(() => {
    db.reset();
  });

  // Base tests from Section 6 of guide
  test('rejects task creation without authentication', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Plan tests' });
    expect(response.status).toBe(401);
  });

  test('rejects an empty title', async () => {
    const token = await createTestUserAndGetToken();
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: ' ' });
    expect(response.status).toBe(400);
  });

  test('does not let one user read another user task', async () => {
    const ownerToken = await createTestUserAndGetToken();
    const strangerToken = await createTestUserAndGetToken();
    const taskId = await createTask(ownerToken, 'Private task');

    const response = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${strangerToken}`);
    expect([403, 404]).toContain(response.status);
  });

  // Practice Exercise 6: API tests for:
  // 1. invalid task ID
  // 2. missing title
  // 3. user attempting to update another user's task
  describe('Practice Exercise 6 requirements', () => {
    test('returns 404 for an invalid / non-existent task ID', async () => {
      const token = await createTestUserAndGetToken();
      const response = await request(app)
        .get('/api/v1/tasks/non-existent-task-id-99999')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/Task not found/i);
    });

    test('rejects task creation when title is missing from payload', async () => {
      const token = await createTestUserAndGetToken();
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({}); // missing title
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('prevents a user from updating another user\'s task (BOLA protection)', async () => {
      const ownerToken = await createTestUserAndGetToken();
      const attackerToken = await createTestUserAndGetToken();
      const taskId = await createTask(ownerToken, 'Legitimate Owner Task');

      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${attackerToken}`)
        .send({ title: 'Hacked Title by Stranger' });

      expect([403, 404]).toContain(response.status);

      // Verify the task title was NOT modified
      const checkRes = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(checkRes.body.title).toBe('Legitimate Owner Task');
    });
  });

  // Practice Exercise 9: BOPLA test
  // "try to update a task with an ownerId field. Verify that the API ignores or rejects it and retains server-derived ownership."
  describe('Practice Exercise 9: Broken Object Property-Level Authorization (BOPLA)', () => {
    test('retains server-derived ownership when client attempts to inject an ownerId during update', async () => {
      const ownerToken = await createTestUserAndGetToken();
      const taskId = await createTask(ownerToken, 'Original Task');

      // Attempt to tamper with ownerId
      const maliciousOwnerId = 'attacker-stolen-ownership-id';
      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Updated with malicious ownerId attempt',
          ownerId: maliciousOwnerId
        });

      expect(response.status).toBe(200);
      expect(response.body.ownerId).not.toBe(maliciousOwnerId);

      // Verify directly in DB that ownership was retained
      const dbTask = db.findTaskById(taskId);
      expect(dbTask.ownerId).not.toBe(maliciousOwnerId);
    });
  });

  // Standard Happy Path CRUD
  describe('Task lifecycle happy path', () => {
    test('user can create, retrieve, update, and delete their tasks', async () => {
      const token = await createTestUserAndGetToken();

      // 1. Create
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Complete testing guide' });
      expect(createRes.status).toBe(201);
      const taskId = createRes.body.id;

      // 2. List
      const listRes = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.tasks.length).toBe(1);
      expect(listRes.body.tasks[0].title).toBe('Complete testing guide');

      // 3. Mark completed
      const updateRes = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completed: true });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.completed).toBe(true);

      // 4. Delete
      const deleteRes = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(deleteRes.status).toBe(204);

      // 5. Verify gone
      const verifyRes = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(verifyRes.status).toBe(404);
    });
  });
});

