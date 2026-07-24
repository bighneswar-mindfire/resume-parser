import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { jwtVerify, errors as joseErrors, type JWTPayload } from 'jose';

export interface AuthPayload extends JWTPayload {
  sub?: string;
  email?: string;
  role?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthPayload;
  }
}

const BEARER_PATTERN = /^Bearer\s+(.+)$/i;

let cachedSecret: Uint8Array | null = null;
let cachedSecretSource: string | null = null;

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      'JWT_SECRET is not configured. Set it in the environment before starting the server.'
    );
  }
  if (cachedSecret && cachedSecretSource === secret) {
    return cachedSecret;
  }
  cachedSecret = new TextEncoder().encode(secret);
  cachedSecretSource = secret;
  return cachedSecret;
}

export function __resetAuthSecretCache(): void {
  cachedSecret = null;
  cachedSecretSource = null;
}

export interface AuthMiddlewareOptions {
  issuer?: string;
  audience?: string;
}

export function requireAuth(options: AuthMiddlewareOptions = {}): RequestHandler {
  const { issuer, audience } = options;

  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ error: 'Missing Authorization header.' });
    }

    const match = BEARER_PATTERN.exec(header);
    if (!match) {
      return res
        .status(401)
        .json({ error: 'Invalid Authorization header. Expected "Bearer <token>".' });
    }

    const token = match[1]!.trim();
    if (!token) {
      return res.status(401).json({ error: 'Bearer token is empty.' });
    }

    let secret: Uint8Array;
    try {
      secret = getSecretKey();
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Auth is misconfigured.';
      return res.status(500).json({ error: 'Server auth configuration error.', details });
    }

    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ['HS256'],
        issuer,
        audience,
      });
      req.auth = payload as AuthPayload;
      return next();
    } catch (error: unknown) {
      if (error instanceof joseErrors.JWTExpired) {
        return res.status(401).json({ error: 'Token has expired.' });
      }
      if (
        error instanceof joseErrors.JWTClaimValidationFailed ||
        error instanceof joseErrors.JWSSignatureVerificationFailed ||
        error instanceof joseErrors.JWSInvalid ||
        error instanceof joseErrors.JWTInvalid
      ) {
        return res.status(401).json({ error: 'Invalid token.' });
      }
      return res.status(401).json({ error: 'Authentication failed.' });
    }
  };
}

export default requireAuth;
