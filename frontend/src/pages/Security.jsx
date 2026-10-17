import { useEffect, useState } from 'react';
import { api } from '../api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';

export default function Security() {
  const { user, setUser, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const [disableForm, setDisableForm] = useState({ password: '', code: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const [sessionData, activityData] = await Promise.all([
      api('/sessions', { auth: true }),
      api('/sessions/activity/log', { auth: true }),
    ]);
    setSessions(sessionData.sessions);
    setActivities(activityData.activities);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function start2FA() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/auth/2fa/setup', { method: 'POST', auth: true });
      setSetup(data);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirm2FA(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('/auth/2fa/verify', {
        method: 'POST',
        auth: true,
        body: { code },
      });
      setUser(data.user);
      setSetup(null);
      setCode('');
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function turnOff2FA(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('/auth/2fa/disable', {
        method: 'POST',
        auth: true,
        body: disableForm,
      });
      setUser(data.user);
      setDisableForm({ password: '', code: '' });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id) {
    setBusy(true);
    setError('');
    try {
      const data = await api(`/sessions/${id}`, { method: 'DELETE', auth: true });
      if (data.revokedCurrent) {
        await logout();
        return;
      }
      setMessage(data.message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function revokeOthers() {
    setBusy(true);
    setError('');
    try {
      const data = await api('/sessions/others', { method: 'DELETE', auth: true });
      setMessage(data.message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout>
        <section className="section">
          <h1>Security center</h1>
          <p className="lede">
            Enable 2FA, review login activity, and manage active devices.
          </p>
          {message && <p className="alert info">{message}</p>}
          {error && <p className="alert error">{error}</p>}
        </section>

        <section className="section">
          <h2>Two-factor authentication</h2>
          <p className="muted">
            Status: {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </p>

          {!user.twoFactorEnabled && !setup && (
            <button className="btn primary" type="button" onClick={start2FA} disabled={busy}>
              Set up 2FA
            </button>
          )}

          {setup && (
            <div className="twofa-setup">
              <img src={setup.qrCodeDataUrl} alt="2FA QR code" width="180" height="180" />
              <p className="muted">Secret key: <code>{setup.secret}</code></p>
              <form className="stack narrow" onSubmit={confirm2FA}>
                <label>
                  Enter code from authenticator
                  <input value={code} onChange={(e) => setCode(e.target.value)} required />
                </label>
                <button className="btn primary" type="submit" disabled={busy}>
                  Enable 2FA
                </button>
              </form>
            </div>
          )}

          {user.twoFactorEnabled && (
            <form className="stack narrow" onSubmit={turnOff2FA}>
              <label>
                Password
                <input
                  type="password"
                  value={disableForm.password}
                  onChange={(e) => setDisableForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </label>
              <label>
                Current 2FA code
                <input
                  value={disableForm.code}
                  onChange={(e) => setDisableForm((p) => ({ ...p, code: e.target.value }))}
                  required
                />
              </label>
              <button className="btn danger" type="submit" disabled={busy}>
                Disable 2FA
              </button>
            </form>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Active devices & sessions</h2>
            <button className="btn ghost" type="button" onClick={revokeOthers} disabled={busy}>
              Sign out other devices
            </button>
          </div>
          <ul className="list">
            {sessions.map((s) => (
              <li key={s.id}>
                <div>
                  <strong>{s.deviceName}</strong>
                  <p className="muted">
                    {s.browser} · {s.os} · {s.ipAddress}
                    {s.current ? ' · This device' : ''}
                  </p>
                  <p className="muted small">
                    Last active {new Date(s.lastActiveAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn ghost compact"
                  onClick={() => revoke(s.id)}
                  disabled={busy}
                >
                  {s.current ? 'Sign out' : 'Revoke'}
                </button>
              </li>
            ))}
            {!sessions.length && <li className="muted">No active sessions.</li>}
          </ul>
        </section>

        <section className="section">
          <h2>Login activity</h2>
          <ul className="list">
            {activities.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{a.success ? 'Successful login' : 'Failed attempt'}</strong>
                  <p className="muted">
                    {a.reason || '—'} · {a.deviceName || 'Unknown device'} · {a.ipAddress}
                  </p>
                  <p className="muted small">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <span className={a.success ? 'pill ok' : 'pill bad'}>
                  {a.success ? 'OK' : 'Blocked'}
                </span>
              </li>
            ))}
            {!activities.length && <li className="muted">No login activity yet.</li>}
          </ul>
        </section>
    </AppLayout>
  );
}
