const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");
export async function request(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || "Request failed");
    error.status = response.status;
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("auth:expired"));
    throw error;
  }
  return payload;
}
export const api = {
  me: () => request("/auth/me"),
  signUp: (body) => request("/auth/signup", { method: "POST", body }),
  signIn: (body) => request("/auth/signin", { method: "POST", body }),
  signOut: () => request("/auth/signout", { method: "POST", body: {} }),
  dashboard: () => request("/dashboard"),
  products: () => request("/products"),
  addProduct: (body) => request("/products", { method: "POST", body }),
  editProduct: (id, body) =>
    request("/products/" + id, { method: "PATCH", body }),
  adjustStock: (id, body) =>
    request("/products/" + id + "/stock", { method: "POST", body }),
  customers: () => request("/customers"),
  addCustomer: (body) => request("/customers", { method: "POST", body }),
  editCustomer: (id, body) =>
    request("/customers/" + id, { method: "PATCH", body }),
  ledger: (id) => request("/customers/" + id + "/ledger"),
  transactions: () => request("/transactions"),
  sale: (body) => request("/transactions/sales", { method: "POST", body }),
  payment: (body) =>
    request("/transactions/payments", { method: "POST", body }),
};
