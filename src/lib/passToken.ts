import crypto from 'crypto';

export interface PassMemberInfo {
  name: string;
  college?: string;
  branch?: string;
  semester?: string;
}

export interface PassTokenPayload {
  id: string;
  slug: string;
  leaderName: string;
  teamName: string | null;
  teamSize: number;
  members: PassMemberInfo[];
  iat: number;
  exp: number;
}

const SIGNING_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'yugantar-2026-delegates-pass-stateless-hmac-secret-pce-etc';

// Derive a 32-byte key from the secret for AES-256-GCM
const DERIVED_KEY = crypto.createHash('sha256').update(SIGNING_SECRET).digest();

/**
 * Creates an encrypted, tamper-proof, stateless pass token using AES-256-GCM.
 * This guarantees that NO readable personal data (names, colleges, team info)
 * is exposed in URL tokens, while keeping the token stateless and verified.
 * Valid for 7 days.
 */
export function signPassToken(data: {
  id: string;
  slug: string;
  leaderName: string;
  teamName: string | null;
  teamSize: number;
  members: PassMemberInfo[];
}): string {
  const payload: PassTokenPayload = {
    ...data,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  };

  const jsonStr = JSON.stringify(payload);
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', DERIVED_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(jsonStr, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Format: v2.<iv>.<tag>.<ciphertext>
  return `v2.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

/**
 * Verifies and decrypts a pass token.
 * Authenticates the GCM tag in constant time.
 * Returns null if the token is tampered, corrupted, expired, or doesn't match expectedId.
 */
export function verifyPassToken(
  token: string | null | undefined,
  expectedId?: string
): PassTokenPayload | null {
  if (!token) return null;

  try {
    // 1. Handle V2 AES-256-GCM Encrypted Token
    if (token.startsWith('v2.')) {
      const parts = token.slice(3).split('.');
      if (parts.length !== 3) return null;

      const [ivB64, tagB64, cipherB64] = parts;
      const iv = Buffer.from(ivB64, 'base64url');
      const tag = Buffer.from(tagB64, 'base64url');
      const ciphertext = Buffer.from(cipherB64, 'base64url');

      if (iv.length !== 12 || tag.length !== 16) return null;

      const decipher = crypto.createDecipheriv('aes-256-gcm', DERIVED_KEY, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      const payload = JSON.parse(decrypted.toString('utf8')) as PassTokenPayload;

      // Check expiration
      if (payload.exp && Date.now() > payload.exp) {
        return null;
      }

      // Check registration ID match if expectedId is supplied
      if (expectedId && payload.id !== expectedId) {
        return null;
      }

      return payload;
    }

    // 2. Backward compatibility: Handle V1 HMAC Signed Token
    const parts = token.split('.');
    if (parts.length === 2) {
      const [base64Data, signature] = parts;
      const expectedSig = crypto
        .createHmac('sha256', SIGNING_SECRET)
        .update(base64Data)
        .digest('base64url');

      if (
        signature.length !== expectedSig.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
      ) {
        return null;
      }

      const jsonStr = Buffer.from(base64Data, 'base64url').toString('utf8');
      const payload = JSON.parse(jsonStr) as PassTokenPayload;

      if (payload.exp && Date.now() > payload.exp) {
        return null;
      }

      if (expectedId && payload.id !== expectedId) {
        return null;
      }

      return payload;
    }

    return null;
  } catch {
    return null;
  }
}

