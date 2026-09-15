import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { money } from '../utils/format.js';
const blankProduct = { name: '', sku: '', category: 'General', sellingPrice: '', costPrice: '', stock: 0, reorderLevel: 5 };
export default function Modal({ modal, data, close, submit }) {
  const [form, setForm] = useState({});
  const [ledger, setLedger] = useState(null);
  const [busy, setBusy] = useState(false);
  const { type, item } = modal;
  useEffect(() => {
    setForm(type === 'product' ? { ...blankProduct, ...item } : type === 'customer' ? { name: item?.name || '', phone: item?.phone || '' } : type === 'stock' ? { direction: 'in', quantity: 1, note: '' } : type === 'sale' ? { productId: '', customerId: '', quantity: 1, paid: 0 } : { amount: '' });
    if (type === 'ledger') api.ledger(item._id).then(setLedger).catch(() => setLedger([]));
  }, [type, item]);
  function change(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }
  const product = data.products.find(p => p._id === form.productId);
  const total = Math.round((product?.sellingPrice || 0) * Number(form.quantity || 0) * 100) / 100;
  const titles = { product: item ? 'Edit product' : 'Add product', customer: item ? 'Edit customer' : 'Add customer', stock: 'Adjust stock', sale: 'Record a sale', payment: 'Record payment', ledger: (item?.name || '') + ' · ledger' };
  function input(label, name, type = 'text', props = {}) { return <label className="field" key={name}><span>{label}</span><input name={name} type={type} value={form[name] ?? ''} onChange={change} {...props} /></label>; }
  async function save(e) {
    e.preventDefault(); if (busy) return; setBusy(true);
    try {
      if (type === 'product') {
        const body = { name: form.name.trim(), sku: form.sku.trim(), category: form.category.trim(), sellingPrice: Number(form.sellingPrice), costPrice: Number(form.costPrice), reorderLevel: Number(form.reorderLevel) };
        if (!item) body.stock = Number(form.stock);
        await submit(() => item ? api.editProduct(item._id, body) : api.addProduct(body));
      }
      if (type === 'customer') await submit(() => item ? api.editCustomer(item._id, form) : api.addCustomer(form));
      if (type === 'stock') await submit(() => api.adjustStock(item._id, { direction: form.direction, quantity: Number(form.quantity), note: form.note }));
      if (type === 'sale') await submit(() => api.sale({ productId: form.productId, customerId: form.customerId || null, quantity: Number(form.quantity), paid: Number(form.paid) }));
      if (type === 'payment') await submit(() => api.payment({ customerId: item._id, amount: Number(form.amount) }));
    } finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><div className="modal" role="dialog" aria-modal="true" aria-label={titles[type]}>
    <div className="modal-head"><div><span className="eyebrow">{type.toUpperCase()}</span><h2>{titles[type]}</h2></div><button className="close" onClick={close} aria-label="Close">×</button></div>
    {type === 'ledger' ? <div className="modal-body"><div className="helper">Current balance: <strong>{money(item.balance)}</strong></div>{ledger === null ? <p>Loading...</p> : ledger.length ? ledger.map(t => <div className="ledger-row" key={t._id}><div><strong>{t.type === 'sale' ? 'Sale · ' + (t.product?.name || 'Product') : 'Payment received'}</strong><small>{new Date(t.createdAt).toLocaleDateString()}</small></div><strong className={t.type === 'sale' ? 'due' : 'received'}>{t.type === 'sale' ? '+' + money(t.total - t.paid) : '−' + money(t.amount)}</strong></div>) : <p className="muted-text">No credit activity yet.</p>}</div> :
    <form onSubmit={save}><div className="modal-body">
      {type === 'product' && <>{input('Product name', 'name', 'text', { required: true })}<div className="field-row">{input('SKU / code', 'sku', 'text', { required: true })}{input('Category', 'category')}</div><div className="field-row">{input('Selling price (Rs)', 'sellingPrice', 'number', { min: 0, step: '0.01', required: true })}{input('Cost price (Rs)', 'costPrice', 'number', { min: 0, step: '0.01', required: true })}</div><div className="field-row">{!item && input('Opening stock', 'stock', 'number', { min: 0, step: 1, required: true })}{input('Reorder alert at', 'reorderLevel', 'number', { min: 0, step: 1, required: true })}</div></>}
      {type === 'customer' && <>{input('Customer name', 'name', 'text', { required: true })}{input('Phone number', 'phone', 'tel')}</>}
      {type === 'stock' && <><div className="helper">Current stock: <strong>{item.stock}</strong></div><label className="field"><span>Movement</span><select name="direction" value={form.direction || 'in'} onChange={change}><option value="in">Stock in</option><option value="out">Stock out</option></select></label>{input('Quantity', 'quantity', 'number', { min: 1, step: 1, required: true })}{input('Note', 'note')}</>}
      {type === 'sale' && <><label className="field"><span>Product</span><select name="productId" value={form.productId || ''} onChange={change} required><option value="">Select a product</option>{data.products.filter(p => p.stock > 0).map(p => <option value={p._id} key={p._id}>{p.name} · {money(p.sellingPrice)} · {p.stock} left</option>)}</select></label>{input('Quantity', 'quantity', 'number', { min: 1, max: product?.stock, step: 1, required: true })}<div className="helper">Sale total: <strong>{money(total)}</strong></div><label className="field"><span>Customer</span><select name="customerId" value={form.customerId || ''} onChange={change}><option value="">Walk-in customer</option>{data.customers.map(c => <option value={c._id} key={c._id}>{c.name}</option>)}</select></label>{input('Amount paid now (Rs)', 'paid', 'number', { min: 0, max: total, step: '0.01', required: true })}<p className="hint">Choose a customer when the amount paid is less than the total.</p></>}
      {type === 'payment' && <><div className="helper">Outstanding balance: <strong>{money(item.balance)}</strong></div>{input('Amount received (Rs)', 'amount', 'number', { min: 0.01, max: item.balance, step: '0.01', required: true })}</>}
    </div><div className="modal-actions"><button type="button" className="btn muted-btn" onClick={close}>Cancel</button><button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div></form>}
  </div></div>;
}
