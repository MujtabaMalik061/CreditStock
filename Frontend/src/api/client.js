const base = import.meta.env.VITE_API_URL || '/api';
export async function request(path, options = {}) {
  const response = await fetch(base + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Request failed');
  return payload;
}
export const api = {
  dashboard: () => request('/dashboard'),
  products: () => request('/products'),
  addProduct: body => request('/products', { method: 'POST', body }),
  editProduct: (id, body) => request('/products/' + id, { method: 'PATCH', body }),
  adjustStock: (id, body) => request('/products/' + id + '/stock', { method: 'POST', body }),
  customers: () => request('/customers'),
  addCustomer: body => request('/customers', { method: 'POST', body }),
  editCustomer: (id, body) => request('/customers/' + id, { method: 'PATCH', body }),
  ledger: id => request('/customers/' + id + '/ledger'),
  transactions: () => request('/transactions'),
  sale: body => request('/transactions/sales', { method: 'POST', body }),
  payment: body => request('/transactions/payments', { method: 'POST', body })
};
