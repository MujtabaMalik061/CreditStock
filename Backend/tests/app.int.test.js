import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Session from '../src/models/session.model.js';
import Product from '../src/models/product.model.js';

const account = { name: 'Ayesha Khan', shopName: 'Corner Store', email: 'ayesha@example.com', password: 'A-strong-password-42' };
const product = { name: 'Rice', sku: 'RICE-01', costPrice: 100, sellingPrice: 150, stock: 20, reorderLevel: 3 };
async function signup(email = account.email) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/signup').send({ ...account, email });
  expect(response.status).toBe(201);
  return { agent, response };
}

describe('Accounts and shop authorization', () => {
  it('exposes health while protecting every shop collection', async () => {
    expect((await request(app).get('/api/health')).status).toBe(200);
    for (const path of ['products', 'customers', 'transactions', 'dashboard', 'auth/me']) {
      expect((await request(app).get('/api/' + path)).status).toBe(401);
    }
    expect((await request(app).post('/api/products').send(product)).status).toBe(401);
  });
  it('registers normalized emails, hashes passwords, and issues an HTTP-only session', async () => {
    const { agent, response } = await signup(' AYESHA@EXAMPLE.COM ');
    expect(response.body.user.email).toBe(account.email);
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect(response.headers['set-cookie'][0]).toMatch(/SameSite=Lax/);
    const stored = await User.findOne().select('+passwordHash');
    expect(stored.passwordHash).not.toBe(account.password);
    expect(await bcrypt.compare(account.password, stored.passwordHash)).toBe(true);
    const raw = response.headers['set-cookie'][0].split(';')[0].split('=')[1];
    expect((await Session.findOne()).tokenHash).not.toBe(raw);
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.shopName).toBe(account.shopName);
    expect(me.headers['cache-control']).toBe('no-store');
  });
  it('rejects invalid signup details and duplicate case-insensitive emails', async () => {
    expect((await request(app).post('/api/auth/signup').send({ ...account, password: 'short' })).status).toBe(400);
    expect((await request(app).post('/api/auth/signup').send({ ...account, password: '🙂'.repeat(19) })).status).toBe(400);
    expect((await request(app).post('/api/auth/signup').send({ ...account, shopName: ' ' })).status).toBe(400);
    await signup();
    expect((await request(app).post('/api/auth/signup').send({ ...account, email: account.email.toUpperCase() })).status).toBe(409);
  });
  it('signs in, rotates sessions, revokes logout cookies, and rejects stale tokens', async () => {
    const { agent, response } = await signup();
    const oldCookie = response.headers['set-cookie'][0].split(';')[0];
    const login = await agent.post('/api/auth/signin').send({ email: account.email, password: account.password });
    expect(login.status).toBe(200);
    expect((await request(app).get('/api/auth/me').set('Cookie', oldCookie)).status).toBe(401);
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    expect((await agent.post('/api/auth/signout').send({})).status).toBe(200);
    expect(await Session.countDocuments()).toBe(0);
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401);
    expect((await agent.get('/api/dashboard')).status).toBe(401);
  });
  it('returns the same error for nonexistent accounts and wrong passwords', async () => {
    await signup();
    const wrong = await request(app).post('/api/auth/signin').send({ email: account.email, password: 'wrong-password' });
    const missing = await request(app).post('/api/auth/signin').send({ email: 'missing@example.com', password: 'wrong-password' });
    expect(wrong.status).toBe(401);
    expect(missing.status).toBe(401);
    expect(missing.body).toEqual(wrong.body);
  });
  it('rejects expired and forged sessions even before TTL cleanup', async () => {
    const { agent } = await signup();
    await Session.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Cookie', 'creditstock_session=' + 'a'.repeat(64))).status).toBe(401);
  });
  it('rejects cross-origin mutations and form submissions', async () => {
    expect((await request(app).post('/api/auth/signup').set('Origin', 'https://untrusted.example').send(account)).status).toBe(403);
    expect((await request(app).post('/api/auth/signup').set('Sec-Fetch-Site', 'cross-site').send(account)).status).toBe(403);
    expect((await request(app).post('/api/auth/signup').type('form').send(account)).status).toBe(415);
    const response = await request(app).options('/api/auth/signin').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'POST');
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
  it('isolates reads, writes, credit, and reports between two accounts', async () => {
    const { agent: owner } = await signup();
    const { agent: other } = await signup('other@example.com');
    const p = (await owner.post('/api/products').send(product)).body;
    const customer = (await owner.post('/api/customers').send({ name: 'Customer' })).body;
    expect((await owner.post('/api/transactions/sales').send({ productId: p._id, customerId: customer._id, quantity: 2, paid: 100 })).status).toBe(201);
    expect((await owner.get('/api/customers')).body[0].balance).toBe(200);
    for (const path of ['products', 'customers', 'transactions']) expect((await other.get('/api/' + path)).body).toEqual([]);
    const dashboard = (await other.get('/api/dashboard')).body;
    expect(dashboard.productCount).toBe(0);
    expect(dashboard.weeklySales).toBe(0);
    expect(dashboard.outstandingCredit).toBe(0);
    expect((await other.patch('/api/products/' + p._id).send({ name: 'Stolen' })).status).toBe(404);
    expect((await other.post('/api/products/' + p._id + '/stock').send({ direction: 'in', quantity: 5 })).status).toBe(409);
    expect((await other.patch('/api/customers/' + customer._id).send({ name: 'Stolen' })).status).toBe(404);
    expect((await other.get('/api/customers/' + customer._id + '/ledger')).status).toBe(404);
    expect((await other.post('/api/transactions/sales').send({ productId: p._id, quantity: 1, paid: 150 })).status).toBe(404);
    expect((await other.post('/api/transactions/payments').send({ customerId: customer._id, amount: 50 })).status).toBe(404);
    // The same SKU can exist in another shop, but not twice in one shop.
    const otherProduct = await other.post('/api/products').send(product);
    expect(otherProduct.status).toBe(201);
    expect((await other.post('/api/products').send(product)).status).toBe(409);
    expect((await other.post('/api/transactions/sales').send({ productId: otherProduct.body._id, customerId: customer._id, quantity: 1, paid: 50 })).status).toBe(404);
    expect((await owner.post('/api/transactions/payments').send({ customerId: customer._id, amount: 50 })).status).toBe(201);
    expect((await owner.get('/api/customers')).body[0].balance).toBe(150);
    expect((await owner.get('/api/dashboard')).body.weeklySales).toBe(300);
  });
  it('never assigns old unowned records to a newly registered account', async () => {
    await Product.collection.insertOne(product);
    const { agent } = await signup();
    expect((await agent.get('/api/products')).body).toEqual([]);
  });
  it('limits repeated failed sign-in attempts', async () => {
    let response;
    for (let i = 0; i < 21; i++) response = await request(app).post('/api/auth/signin').send({ email: 'invalid' });
    expect(response.status).toBe(429);
    expect(response.body.message).toContain('Too many attempts');
  });
});
