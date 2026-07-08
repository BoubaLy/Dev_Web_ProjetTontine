import axios from 'axios';

export const TOKEN_KEY = 'tontinesecure_token';

// URL de l'API — configurable via VITE_API_URL (fichier .env).
const baseURL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api/v1';

const api = axios.create({ baseURL, headers: { Accept: 'application/json' }, timeout: 15000 });

// Ajoute le token Bearer à chaque requête.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Déconnecte si le token est invalide/expiré.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) localStorage.removeItem(TOKEN_KEY);
    return Promise.reject(error);
  }
);

export default api;
