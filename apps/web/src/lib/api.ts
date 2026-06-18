import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/api/v1';

export const api = axios.create({ baseURL: API });

// Attach bearer token from memory (set by the auth store).
let token: string | null = null;
export function setAuthToken(t: string | null) {
  token = t;
  if (t) api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
  else delete api.defaults.headers.common['Authorization'];
}

export async function login(email: string, password: string) {
  // Backend uses OAuth2 form: field is `username`, we send email.
  const body = new URLSearchParams({ username: email, password });
  const { data } = await api.post('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data.access_token as string;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data as { id: string; email: string; username: string; is_admin: boolean };
}
