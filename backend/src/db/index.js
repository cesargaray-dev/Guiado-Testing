'use strict';

/**
 * Isolated Database Layer
 * Simulates a PostgreSQL database connection with row-level ownership isolation,
 * foreign keys, and atomic state reset for tests.
 */
class Database {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = new Map(); // id -> { id, email, password, refreshTokens: Set }
    this.tasks = new Map(); // id -> { id, title, completed, ownerId, createdAt }
    this.revokedTokens = new Set();
  }

  // Users
  createUser({ id, email, password }) {
    if (this.findUserByEmail(email)) {
      const err = new Error('User already exists');
      err.code = '23505'; // PostgreSQL unique violation code
      throw err;
    }
    const user = {
      id: id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: email.toLowerCase(),
      password,
      refreshTokens: new Set()
    };
    this.users.set(user.id, user);
    return { id: user.id, email: user.email };
  }

  findUserByEmail(email) {
    if (!email) return null;
    for (const user of this.users.values()) {
      if (user.email === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  findUserById(id) {
    return this.users.get(id) || null;
  }

  addRefreshToken(userId, token) {
    const user = this.users.get(userId);
    if (user) {
      user.refreshTokens.add(token);
    }
  }

  removeRefreshToken(userId, token) {
    const user = this.users.get(userId);
    if (user) {
      user.refreshTokens.delete(token);
    }
    this.revokedTokens.add(token);
  }

  revokeAllUserTokens(userId) {
    const user = this.users.get(userId);
    if (user) {
      for (const t of user.refreshTokens) {
        this.revokedTokens.add(t);
      }
      user.refreshTokens.clear();
    }
  }

  isTokenRevoked(token) {
    return this.revokedTokens.has(token);
  }

  // Tasks
  createTask({ id, title, ownerId, completed = false }) {
    if (!ownerId) {
      throw new Error('ownerId is required (foreign key constraint)');
    }
    const task = {
      id: id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      completed: Boolean(completed),
      ownerId,
      createdAt: new Date().toISOString()
    };
    this.tasks.set(task.id, task);
    return { ...task };
  }

  findTaskById(taskId) {
    const task = this.tasks.get(taskId);
    return task ? { ...task } : null;
  }

  findTasksByOwner(ownerId) {
    const results = [];
    for (const task of this.tasks.values()) {
      if (task.ownerId === ownerId) {
        results.push({ ...task });
      }
    }
    return results;
  }

  updateTask(taskId, updates, authenticatedOwnerId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }
    // Broken Object Level Authorization (BOLA) guard:
    if (task.ownerId !== authenticatedOwnerId) {
      const err = new Error('Access denied: not the owner of this task');
      err.status = 403;
      throw err;
    }

    // Broken Object Property Level Authorization (BOPLA) guard:
    // Clients cannot change the ownerId. Server-derived ownership is strictly retained.
    if ('ownerId' in updates && updates.ownerId !== task.ownerId) {
      // Discard ownerId tampering or throw error
      delete updates.ownerId;
    }

    if (updates.title !== undefined) {
      task.title = updates.title;
    }
    if (updates.completed !== undefined) {
      task.completed = Boolean(updates.completed);
    }

    this.tasks.set(taskId, task);
    return { ...task };
  }

  deleteTask(taskId, authenticatedOwnerId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }
    if (task.ownerId !== authenticatedOwnerId) {
      const err = new Error('Access denied: not the owner of this task');
      err.status = 403;
      throw err;
    }
    this.tasks.delete(taskId);
    return true;
  }
}

const db = new Database();
module.exports = db;
