import { test } from 'node:test';
import assert from 'node:assert/strict';
import { secretsMatch } from './security.js';

test('secretsMatch accepts only the exact secret', () => {
  const secret = 'correct-horse-battery-staple-32b';
  assert.equal(secretsMatch(secret, secret), true);
  assert.equal(secretsMatch('wrong-horse-battery-staple-32bx', secret), false);
  assert.equal(secretsMatch('', secret), false);
  assert.equal(secretsMatch(secret, ''), false);
  assert.equal(secretsMatch(undefined, secret), false);
});
