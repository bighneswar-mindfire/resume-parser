import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { SignJWT } from 'jose';
import { requireAuth, __resetAuthSecretCache } from '../authMiddleware.js';

// Test-only HMAC secret used to sign fixture JWTs in this suite. Not a real credential.
const SECRET = 'test-secret-that-is-long-enough-for-hs256'; // gitleaks:allow

async function makeToken(
  payload: Record<string, unknown> = { sub: 'user-1' },
  options: {
    secret?: string;
    expiresIn?: string;
    issuer?: string;
    audience?: string;
    notBefore?: string;
  } = {}
): Promise<string> {
  const secret = new TextEncoder().encode(options.secret ?? SECRET);
  let jwt = new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt();
  if (options.expiresIn) jwt = jwt.setExpirationTime(options.expiresIn);
  if (options.issuer) jwt = jwt.setIssuer(options.issuer);
  if (options.audience) jwt = jwt.setAudience(options.audience);
  if (options.notBefore) jwt = jwt.setNotBefore(options.notBefore);
  return jwt.sign(secret);
}

function buildApp(auth = requireAuth()) {
  const app = express();
  app.get('/protected', auth, (req, res) => {
    res.status(200).json({ ok: true, auth: req.auth });
  });
  return app;
}

describe('requireAuth middleware', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
    __resetAuthSecretCache();
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
    __resetAuthSecretCache();
  });

  it('rejects requests with no Authorization header', async () => {
    const res = await request(buildApp()).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing authorization/i);
  });

  it('rejects a malformed Authorization header', async () => {
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Token abc.def.ghi');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid authorization/i);
  });

  it('rejects an empty bearer token', async () => {
    const res = await request(buildApp()).get('/protected').set('Authorization', 'Bearer    ');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/authorization|empty/i);
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await makeToken({ sub: 'user-1' }, { secret: 'a-different-secret-value-here' });
    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid token/i);
  });

  it('rejects a structurally invalid token', async () => {
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid token/i);
  });

  it('rejects an expired token', async () => {
    const secret = new TextEncoder().encode(SECRET);
    const token = await new SignJWT({ sub: 'user-1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
      .sign(secret);

    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });

  it('accepts a valid token and attaches the payload to req.auth', async () => {
    const token = await makeToken({ sub: 'user-42', email: 'jane@example.com', role: 'admin' });
    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.auth).toMatchObject({
      sub: 'user-42',
      email: 'jane@example.com',
      role: 'admin',
    });
  });

  it('is case-insensitive on the "Bearer" scheme', async () => {
    const token = await makeToken();
    const res = await request(buildApp()).get('/protected').set('Authorization', `bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('enforces the issuer claim when configured', async () => {
    const goodToken = await makeToken({ sub: 'u' }, { issuer: 'resume-parser' });
    const badToken = await makeToken({ sub: 'u' }, { issuer: 'someone-else' });

    const app = buildApp(requireAuth({ issuer: 'resume-parser' }));

    const good = await request(app).get('/protected').set('Authorization', `Bearer ${goodToken}`);
    expect(good.status).toBe(200);

    const bad = await request(app).get('/protected').set('Authorization', `Bearer ${badToken}`);
    expect(bad.status).toBe(401);
    expect(bad.body.error).toMatch(/invalid token/i);
  });

  it('enforces the audience claim when configured', async () => {
    const goodToken = await makeToken({ sub: 'u' }, { audience: 'resume-parser-api' });
    const badToken = await makeToken({ sub: 'u' }, { audience: 'other-api' });

    const app = buildApp(requireAuth({ audience: 'resume-parser-api' }));

    const good = await request(app).get('/protected').set('Authorization', `Bearer ${goodToken}`);
    expect(good.status).toBe(200);

    const bad = await request(app).get('/protected').set('Authorization', `Bearer ${badToken}`);
    expect(bad.status).toBe(401);
  });

  it('returns 500 when JWT_SECRET is not configured', async () => {
    delete process.env.JWT_SECRET;
    __resetAuthSecretCache();

    const token = await makeToken();
    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/auth configuration/i);
  });
});
