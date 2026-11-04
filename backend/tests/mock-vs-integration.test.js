'use strict';

/**
 * Practice Exercise 15: Mocked Test vs Integration Test
 * Demonstrates the exact behavioral difference, speed difference, and failure modes.
 */
const request = require('supertest');
const { app } = require('../src/app');
const db = require('../src/db');
const { generateTokens } = require('../src/auth/jwt');

// Simulated client SDK
class TaskApiClient {
  constructor(httpClient) {
    this.http = httpClient;
  }

  async getTasks(token) {
    return this.http.get('/api/v1/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}

describe('Practice Exercise 15: Mocked Client Test vs Real Integration Test', () => {
  beforeEach(() => {
    db.reset();
  });

  // 1. MOCKED API-CLIENT TEST
  describe('Mocked API-Client Test', () => {
    test('verifies client parses response structure when API is mocked', async () => {
      // Setup mock transport
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          status: 200,
          data: {
            tasks: [
              { id: 'mock-1', title: 'Mocked Task', completed: false, ownerId: 'user-1' }
            ]
          }
        })
      };

      const client = new TaskApiClient(mockHttpClient);
      const result = await client.getTasks('dummy-token');

      // What it catches:
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/tasks',
        { headers: { Authorization: 'Bearer dummy-token' } }
      );
      expect(result.status).toBe(200);
      expect(result.data.tasks).toHaveLength(1);
      expect(result.data.tasks[0].title).toBe('Mocked Task');

      /*
        ANALYSIS OF MOCKED TEST:
        - Catches: Client argument passing, URL formatting, response parsing logic, fast execution.
        - Cannot catch:
          1. If the server database schema changed (e.g., column renamed).
          2. If JWT authentication middleware rejects the token.
          3. If the server returned a 500 due to bad SQL syntax.
          4. If CORS or security headers are missing.
      */
    });

    test('verifies client handles simulated server 500 error gracefully', async () => {
      const mockHttpClient = {
        get: jest.fn().mockRejectedValue(new Error('Network error / 500 Internal Server Error'))
      };

      const client = new TaskApiClient(mockHttpClient);
      await expect(client.getTasks('dummy-token')).rejects.toThrow('Network error');
    });
  });

  // 2. REAL API INTEGRATION TEST (Dedicated Test Database)
  describe('API Integration Test with Dedicated Test Database', () => {
    test('verifies end-to-end integration: HTTP, auth middleware, routes, and DB persistence', async () => {
      // 1. Seed user in isolated database
      const user = db.createUser({
        email: 'integration_tester@example.test',
        password: 'ValidPassword123!'
      });
      const { accessToken } = generateTokens(user);

      // 2. Seed task directly in test database
      db.createTask({
        id: 'real-db-task-1',
        title: 'Real Persisted Task',
        ownerId: user.id
      });

      // 3. Perform real HTTP Supertest request through Express stack
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      // What it catches:
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body.tasks).toBeDefined();
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].id).toBe('real-db-task-1');
      expect(response.body.tasks[0].title).toBe('Real Persisted Task');
      expect(response.body.tasks[0].ownerId).toBe(user.id);

      /*
        ANALYSIS OF INTEGRATION TEST:
        - Catches: Real JWT signature validation, Express routing, header negotiation,
          database query correctness, row-level ownership isolation, data persistence.
        - Cannot catch:
          1. UI widget layout bugs, pixel overflows.
          2. Mobile device lifecycle events (app backgrounding, memory pressure).
          3. Slower execution compared to in-memory mock.
      */
    });
  });
});

