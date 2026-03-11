// Custom API client that replaces the Base44 SDK.
// Points to the KudiLoc C# API instead of the Base44 cloud backend.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API error ${res.status}`);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

function buildQuery(filters = {}) {
  return Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

const ATM = {
  list: (sort = '-updated_date', limit = 200) =>
    apiFetch(`/api/atm?sort=${encodeURIComponent(sort)}&limit=${limit}`),

  filter: (filters = {}, sort = '-updated_date', limit = 200) => {
    const q = buildQuery(filters);
    return apiFetch(`/api/atm?${q}&sort=${encodeURIComponent(sort)}&limit=${limit}`);
  },

  create: (data) =>
    apiFetch('/api/atm', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) =>
    apiFetch(`/api/atm/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

const Report = {
  create: (data) =>
    apiFetch('/api/reports', { method: 'POST', body: JSON.stringify(data) }),

  filter: (filters = {}, sort = '-created_date', limit = 20) => {
    const q = buildQuery(filters);
    return apiFetch(`/api/reports?${q}&sort=${encodeURIComponent(sort)}&limit=${limit}`);
  },
};

const auth = {
  // Returns an anonymous user — kudi-cash-find runs without authentication.
  // reporter_reputation defaults to 50 for anonymous submissions.
  me: () =>
    Promise.resolve({
      id: 'anonymous',
      full_name: 'Utilizador Anónimo',
      email: null,
      reputation_score: 50,
    }),

  logout: () => {
    // No session to clear in anonymous mode
  },
};

export const base44 = {
  entities: { ATM, Report },
  auth,
};
