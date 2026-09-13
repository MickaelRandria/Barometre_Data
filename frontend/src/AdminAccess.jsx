import React, { useCallback, useEffect, useState } from 'react';
import './AdminAccess.css';

async function adminRequest(method, password) {
  const response = await fetch('/api/admin-session', {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(10000),
    ...(password === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }),
  });
  if (response.status === 401) throw new Error('Mot de passe incorrect.');
  if (!response.ok) throw new Error('Connexion indisponible. Réessaie dans un instant.');
  return response.json();
}

export default function AdminAccess({ children, onCancel }) {
  const [status, setStatus] = useState('checking');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('simulation');
  const requireLogin = useCallback(() => setStatus('login'), []);

  useEffect(() => {
    let active = true;
    adminRequest('GET').then((data) => {
      if (active) setStatus(data.authenticated ? 'authenticated' : 'login');
    }).catch(() => { if (active) setStatus('login'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    // Recheck on focus and periodically, so an expired session closes the screen.
    const check = () => adminRequest('GET').then((data) => {
      if (!data.authenticated) setStatus('login');
    }).catch(() => setStatus('login'));
    const timer = window.setInterval(check, 60000);
    window.addEventListener('focus', check);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', check); };
  }, [status]);

  async function login(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await adminRequest('POST', password);
      if (data.authenticated) { setPassword(''); setStatus('authenticated'); }
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await adminRequest('DELETE');
      setStatus('login');
      setPassword('');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (status === 'authenticated') return (
    <div className="admin-access">
      <div className="admin-auth-controls"><div className="admin-view-switch" role="group" aria-label="Version analytics"><button type="button" aria-pressed={view === 'simulation'} onClick={() => setView('simulation')}>V0</button><button type="button" aria-pressed={view === 'live'} onClick={() => setView('live')}>V1</button></div><span role="status">{error}</span><button type="button" className="pill-btn dark" onClick={logout} disabled={busy}>Se déconnecter</button></div>
      {React.cloneElement(children, { source: view, onUnauthorized: requireLogin })}
    </div>
  );

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <span className="admin-login-badge">Baromètre Data · Administration</span>
        <h1 id="admin-login-title">Accès administrateur</h1>
        {status === 'checking' ? <p role="status">Vérification de la session…</p> : (
          <form onSubmit={login}>
            <label htmlFor="admin-password">Mot de passe</label>
            <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={256} autoFocus disabled={busy} aria-describedby={error ? 'admin-login-error' : undefined} />
            {error && <p id="admin-login-error" className="admin-login-error" role="alert">{error}</p>}
            <button type="submit" className="pill-btn neon" disabled={busy || !password}>{busy ? 'Connexion…' : 'Ouvrir le dashboard'}</button>
          </form>
        )}
        <button type="button" className="admin-login-back" onClick={onCancel}>← Retour au livre blanc</button>
      </section>
    </main>
  );
}
