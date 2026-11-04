'use strict';

/**
 * Trims and validates a task title.
 *
 * @param {unknown} value - Untrusted title input.
 * @returns {string} The validated title.
 * @throws {TypeError} When the title is not valid.
 */
function validateTitle(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Enter a valid title.');
  }
  const title = value.trim();
  if (title.length < 1 || title.length > 120) {
    throw new TypeError('Enter a valid title.');
  }
  return title;
}

/**
 * Validates a user password according to security boundaries (min 8, max 64 chars).
 * (Practice Exercise 8)
 *
 * @param {unknown} value - Untrusted password input.
 * @returns {string} The validated password.
 * @throws {TypeError|Error} When the password does not meet boundary constraints.
 */
function validatePassword(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Password must be a string.');
  }
  if (value.trim().length === 0) {
    throw new Error('Password cannot be empty or whitespace.');
  }
  if (value.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  if (value.length > 64) {
    throw new Error('Password cannot exceed 64 characters.');
  }
  return value;
}

module.exports = { validateTitle, validatePassword };
