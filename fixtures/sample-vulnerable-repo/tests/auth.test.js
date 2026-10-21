const test = require('node:test');
const assert = require('node:assert');
const { authenticateToken } = require('../src/middleware/auth.js');

test('rejects expired tokens with 401 Unauthorized', () => {
  // Expired token (exp timestamp set to 1 hour in the past)
  const expiredPayload = {
    sub: 'user_123',
    role: 'shopper',
    exp: Math.floor(Date.now() / 1000) - 3600,
  };
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(expiredPayload)).toString('base64')}.fakesig`;

  const response = authenticateToken(token);
  assert.strictEqual(
    response.status,
    401,
    `Security regression: Expired token bypassed authentication (expected status 401, got ${response.status})`
  );
});

test('allows valid unexpired tokens with 200 OK', () => {
  // Valid token (exp timestamp 2 hours in the future)
  const validPayload = {
    sub: 'user_456',
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 7200,
  };
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(validPayload)).toString('base64')}.fakesig`;

  const response = authenticateToken(token);
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.user.sub, 'user_456');
});
