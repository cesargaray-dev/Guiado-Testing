'use strict';

const { validateTitle, validatePassword } = require('../src/tasks/validation');

describe('validateTitle', () => {
  // Tests from Section 4 of the guide
  test('trims a valid title', () => {
    expect(validateTitle(' Plan tests ')).toBe('Plan tests');
  });

  test('rejects a blank title', () => {
    expect(() => validateTitle(' ')).toThrow('Enter a valid title.');
  });

  test('rejects a title longer than the limit', () => {
    expect(() => validateTitle('a'.repeat(121))).toThrow();
  });

  // Practice Exercise 4: Unit test for valid title at maximum allowed length (120 characters)
  test('accepts a valid title at the maximum allowed length (120 characters)', () => {
    const maxTitle = 'a'.repeat(120);
    expect(validateTitle(maxTitle)).toBe(maxTitle);
    expect(validateTitle(maxTitle).length).toBe(120);
  });

  // Boundary value tests (Section 8)
  test('accepts a valid title at minimum allowed length (1 character)', () => {
    expect(validateTitle('a')).toBe('a');
  });

  test('rejects non-string input safely', () => {
    expect(() => validateTitle(42)).toThrow(TypeError);
    expect(() => validateTitle(null)).toThrow(TypeError);
    expect(() => validateTitle(undefined)).toThrow(TypeError);
    expect(() => validateTitle({})).toThrow(TypeError);
  });
});

describe('validatePassword (Practice Exercise 8 - Boundary Value Analysis)', () => {
  test('rejects an empty password', () => {
    expect(() => validatePassword('')).toThrow('Password cannot be empty or whitespace.');
  });

  test('rejects whitespace-only password', () => {
    expect(() => validatePassword('        ')).toThrow('Password cannot be empty or whitespace.');
  });

  test('rejects password below minimum boundary (7 characters)', () => {
    expect(() => validatePassword('Pass123')).toThrow('Password must be at least 8 characters.');
  });

  test('accepts password at minimum boundary (8 characters)', () => {
    expect(validatePassword('Pass1234')).toBe('Pass1234');
  });

  test('accepts typical valid password', () => {
    expect(validatePassword('SuperSecret123!')).toBe('SuperSecret123!');
  });

  test('accepts password at maximum boundary (64 characters)', () => {
    const maxPass = 'P'.repeat(64);
    expect(validatePassword(maxPass)).toBe(maxPass);
  });

  test('rejects password above maximum boundary (65 characters)', () => {
    const overPass = 'P'.repeat(65);
    expect(() => validatePassword(overPass)).toThrow('Password cannot exceed 64 characters.');
  });

  test('rejects non-string password safely', () => {
    expect(() => validatePassword(12345678)).toThrow(TypeError);
    expect(() => validatePassword(null)).toThrow(TypeError);
  });
});

