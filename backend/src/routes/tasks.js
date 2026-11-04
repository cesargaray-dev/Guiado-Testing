'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../auth/jwt');
const { validateTitle } = require('../tasks/validation');

// All task routes require authentication
router.use(authenticate);

// GET /api/v1/tasks - Get all tasks for current authenticated user
router.get('/', (req, res) => {
  const tasks = db.findTasksByOwner(req.user.id);
  res.json({ tasks });
});

// POST /api/v1/tasks - Create task
router.post('/', (req, res) => {
  const { title } = req.body;
  if (title === undefined || title === null) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  try {
    const validatedTitle = validateTitle(title);
    // Notice: ownerId is strictly derived from req.user.id (server-side authenticated session)
    const task = db.createTask({
      title: validatedTitle,
      ownerId: req.user.id
    });
    return res.status(201).json(task);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/v1/tasks/:id - Get specific task
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const task = db.findTaskById(id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  // Broken Object Level Authorization (BOLA) protection:
  // Using 404 (or 403) so unauthorized users cannot enumerate other users' task IDs
  if (task.ownerId !== req.user.id) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  return res.json(task);
});

// PUT /api/v1/tasks/:id - Update task
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const task = db.findTaskById(id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  // Broken Object Level Authorization (BOLA) check
  if (task.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: You do not own this task.' });
  }

  const updates = {};

  // Practice Exercise 6: Handle missing or invalid title
  if ('title' in req.body) {
    if (req.body.title === undefined || req.body.title === null) {
      return res.status(400).json({ error: 'Title cannot be null or undefined.' });
    }
    try {
      updates.title = validateTitle(req.body.title);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  if ('completed' in req.body) {
    if (typeof req.body.completed !== 'boolean') {
      return res.status(400).json({ error: 'Completed must be a boolean.' });
    }
    updates.completed = req.body.completed;
  }

  // Practice Exercise 9: Verify ownerId cannot be overridden (BOPLA check)
  // If the client attempted to inject an ownerId, we ignore it or retain server ownership
  if ('ownerId' in req.body && req.body.ownerId !== req.user.id) {
    // API discards client tampering and preserves server-derived ownership
    // (Could also return a 400 Bad Request, but ignoring or enforcing server ownership complies with OWASP API3:2023)
  }

  const updatedTask = db.updateTask(id, updates, req.user.id);
  return res.json(updatedTask);
});

// DELETE /api/v1/tasks/:id - Delete task
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const task = db.findTaskById(id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  if (task.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: You do not own this task.' });
  }

  db.deleteTask(id, req.user.id);
  return res.status(204).send();
});

module.exports = router;

