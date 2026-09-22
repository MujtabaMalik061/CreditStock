import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
delete process.env.CLIENT_ORIGIN;
const { default: app } = await import('../src/app.js');
const origin = 'https://credit-stock.vercel.app';

test('production frontend preflight permits credentialed GET and POST', async () => {
  for (const method of ['GET', 'POST']) {
    const response = await request(app).options('/api/auth/me')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', method)
      .set('Access-Control-Request-Headers', 'content-type');
    assert.equal(response.status, 204);
    assert.equal(response.headers['access-control-allow-origin'], origin);
    assert.equal(response.headers['access-control-allow-credentials'], 'true');
    assert.match(response.headers['access-control-allow-headers'], /content-type/i);
    assert.ok(response.headers['access-control-allow-methods'].includes(method));
  }
});

test('unauthenticated responses retain CORS headers', async () => {
  const response = await request(app).get('/api/auth/me').set('Origin', origin);
  assert.equal(response.status, 401);
  assert.equal(response.headers['access-control-allow-origin'], origin);
});

test('trusted cross-site POST reaches validation', async () => {
  const response = await request(app).post('/api/auth/signup')
    .set('Origin', origin).set('Sec-Fetch-Site', 'cross-site').send({});
  assert.equal(response.status, 400);
});

test('untrusted and originless cross-site mutations remain blocked', async () => {
  for (const untrusted of ['https://untrusted.example', 'null', undefined]) {
    const req = request(app).post('/api/auth/signup').set('Sec-Fetch-Site', 'cross-site');
    if (untrusted) req.set('Origin', untrusted);
    assert.equal((await req.send({})).status, 403);
  }
  const response = await request(app).options('/api/auth/me')
    .set('Origin', 'https://untrusted.example').set('Access-Control-Request-Method', 'GET');
  assert.equal(response.headers['access-control-allow-origin'], undefined);
});

test('production session cookies support HTTPS cross-site authentication', async () => {
  process.env.NODE_ENV = 'production';
  try {
    const { cookieOptions } = await import('../src/utils/session.js?production-check');
    assert.equal(cookieOptions.sameSite, 'none');
    assert.equal(cookieOptions.secure, true);
    assert.equal(cookieOptions.httpOnly, true);
  } finally {
    process.env.NODE_ENV = 'test';
  }
});
