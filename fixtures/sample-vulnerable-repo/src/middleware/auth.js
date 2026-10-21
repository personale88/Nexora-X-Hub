// Middleware module: src/middleware/auth.js
// Validates Bearer authentication tokens

function authenticateToken(token) {
  if (!token) {
    return { status: 401, error: 'Authentication token missing' };
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { status: 403, error: 'Malformed token' };
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

    // BUG AUTH-104: Payload accepted without validating exp timestamp
    if (payload) {
      return { status: 200, user: payload };
    }
  } catch (err) {
    return { status: 403, error: 'Token invalid signature' };
  }

  return { status: 401, error: 'Unauthorized access' };
}

module.exports = { authenticateToken };
