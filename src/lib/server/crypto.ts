import crypto from 'crypto';

// Secret key for AES-256-GCM encryption at rest
// In production, AUTH_SECRET must be set in environment variables.
const getSecretKey = (): Buffer => {
  const secret = process.env.AUTH_SECRET || 'repopilot-default-development-secret-key-32b!';
  // Hash to ensure exact 32 bytes for aes-256-gcm
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypt a sensitive token (e.g. GitHub OAuth Access Token) using AES-256-GCM.
 * Never stores plaintext tokens.
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const key = getSecretKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted token.
 */
export function decryptToken(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return '';

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getSecretKey();

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt token:', err);
    return '';
  }
}

/**
 * Generate a secure cryptographically random session token (32 bytes = 256 bits).
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a cryptographically secure OAuth state parameter.
 */
export function generateOAuthState(data: Record<string, any> = {}): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = JSON.stringify({ ...data, nonce, exp: Date.now() + 10 * 60 * 1000 }); // 10 min expiry
  return Buffer.from(payload).toString('base64url');
}

/**
 * Verify an OAuth state parameter.
 */
export function verifyOAuthState(state: string): { valid: boolean; data?: any } {
  try {
    const jsonStr = Buffer.from(state, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed.exp !== 'number') {
      return { valid: false };
    }
    if (Date.now() > parsed.exp) {
      return { valid: false }; // Expired
    }
    return { valid: true, data: parsed };
  } catch {
    return { valid: false };
  }
}

/**
 * Generate PKCE code verifier and code challenge (S256).
 */
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}
