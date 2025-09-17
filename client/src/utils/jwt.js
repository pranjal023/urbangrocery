export function validToken() {
  const t = localStorage.getItem('token');
  if (!t) return null;
  try {
    const [, payload] = t.split('.');
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (json?.exp && Date.now() / 1000 > json.exp) {
      localStorage.removeItem('token');
      return null;
    }
    return t;
  } catch {
    return t; // best-effort; server will 401 if bad
  }
}
