/**
 * Cliente da API.
 *
 * Fala com exatamente o mesmo backend da versão web (Cloudflare Worker + KV),
 * por isso a conta e os dados são partilhados entre a app e o site.
 *
 * Muda API_BASE para o teu domínio antes de compilar para produção.
 */

export const API_BASE = 'https://iron-log.daapsyt.workers.dev/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    // resposta sem corpo JSON válido
  }

  if (!res.ok) {
    const error = new Error((json && json.error) || `Erro ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return json;
}

/* ---------- Autenticação ---------- */

export function register(username, password) {
  return request('/auth-register', {
    method: 'POST',
    body: { username, password },
  });
}

export function login(username, password) {
  return request('/auth-login', {
    method: 'POST',
    body: { username, password },
  });
}

/* ---------- Dados do utilizador ---------- */

export function loadData(token) {
  return request('/data-sync', { token });
}

export function saveData(token, data, settings) {
  return request('/data-sync', {
    method: 'POST',
    token,
    body: { data, settings },
  });
}

/* ---------- Social ---------- */

export function loadSocial(token) {
  return request('/social', { token });
}

export function searchFriends(token, query) {
  return request(`/friends-search?q=${encodeURIComponent(query)}`, { token });
}

export function friendsAction(token, payload) {
  return request('/friends-action', { method: 'POST', token, body: payload });
}

/* ---------- Nutrição ---------- */

export function searchFood(query) {
  return request(`/off-search?q=${encodeURIComponent(query)}`);
}
