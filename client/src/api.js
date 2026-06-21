const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API 오류');
  }
  if (res.headers.get('content-type')?.includes('text/csv')) {
    return res.blob();
  }
  return res.json();
}

export const api = {
  // Sessions
  getSessions: () => request('/sessions'),
  getSession: (id) => request(`/sessions/${id}`),
  createSession: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateSessionStatus: (id, status) =>
    request(`/sessions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ session_status: status }) }),
  getSessionOrders: (id) => request(`/sessions/${id}/orders`),
  getSessionStats: (id) => request(`/sessions/${id}/stats`),

  // Orders
  getOrders: () => request('/orders'),
  getOrderByToken: (token) => request(`/orders/token/${token}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  payOrder: (id) => request(`/orders/${id}/pay`, { method: 'POST' }),
  markScreenshot: (id) => request(`/orders/${id}/screenshot`, { method: 'PATCH' }),

  // Bundles
  getBundles: () => request('/bundles'),
  getBundleByToken: (token) => request(`/bundles/token/${token}`),
  saveAddress: (token, data) =>
    request(`/bundles/token/${token}/address`, { method: 'PUT', body: JSON.stringify(data) }),
  mergeBundles: (data) => request('/bundles/merge', { method: 'POST', body: JSON.stringify(data) }),

  // Customers
  getCustomers: () => request('/customers'),
  getCustomer: (id) => request(`/customers/${id}`),

  // Export
  downloadCsv: (sessionId) => request(`/export/csv/${sessionId}`),
  getDmLog: () => request('/export/dm-log'),
};
