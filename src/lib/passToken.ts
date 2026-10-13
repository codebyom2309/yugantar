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

/**
 * Creates a signed, tamper-proof, stateless pass token that contains
 * the complete team roster and identification.
 * This completely eliminates the need to store full registration JSON or passes in TiDB.
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
  const base64Data = Buffer.from(jsonStr, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(base64Data)
    .digest('base64url');

  return `${base64Data}.${signature}`;
}

/**
 * Verifies a pass token's HMAC-SHA256 signature and returns the payload.
 * Returns null if the token is tampered, corrupted, expired, or doesn't match expectedId.
 */
export function verifyPassToken(
  token: string | null | undefined,
  expectedId?: string
): PassTokenPayload | null {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [base64Data, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', SIGNING_SECRET)
      .update(base64Data)
      .digest('base64url');

    // Constant-time comparison
    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return null;
    }

    const jsonStr = Buffer.from(base64Data, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr) as PassTokenPayload;

    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    // Check registration ID match if expectedId is supplied
    if (expectedId && payload.id !== expectedId) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
