import { Router } from 'express';
import Customer from '../models/customer.model.js';
import Transaction from '../models/transaction.model.js';
import { balances } from '../services/credit.service.js';
import { asyncRoute, fail } from '../utils/http.js';
const router = Router();
router.get('/', asyncRoute(async (req, res) => {
  const [items, due] = await Promise.all([Customer.find({ owner: req.owner }).sort({ name: 1 }).lean(), balances(req.owner)]);
  res.json(items.map(item => ({ ...item, balance: due[String(item._id)] || 0 })));
}));
router.post('/', asyncRoute(async (req, res) => {
  if (!String(req.body.name || '').trim()) return fail(res, 'Customer name is required');
  res.status(201).json(await Customer.create({ owner: req.owner, name: req.body.name, phone: req.body.phone || '' }));
}));
router.patch('/:id', asyncRoute(async (req, res) => {
  const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => ['name', 'phone'].includes(key)));
  if ('name' in changes && !String(changes.name).trim()) return fail(res, 'Customer name is required');
  const item = await Customer.findOneAndUpdate({ _id: req.params.id, owner: req.owner }, changes, { new: true, runValidators: true });
  if (!item) return fail(res, 'Customer not found', 404);
  res.json(item);
}));
router.get('/:id/ledger', asyncRoute(async (req, res) => {
  if (!await Customer.exists({ _id: req.params.id, owner: req.owner })) return fail(res, 'Customer not found', 404);
  res.json(await Transaction.find({ owner: req.owner, customer: req.params.id }).populate('product', 'name sku').sort({ createdAt: -1 }));
}));
export default router;
