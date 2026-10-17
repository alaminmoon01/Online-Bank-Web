import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }

    setBusy(true);
    try {
      await register(form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Register with your personal details to get started."
    >
      <form className="stack" onSubmit={onSubmit}>
        <label>
          Full name
          <input value={form.fullName} onChange={update('fullName')} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} required />
        </label>
        <label>
          Phone <span className="optional">(optional)</span>
          <input value={form.phone} onChange={update('phone')} />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength={8}
            value={form.password}
            onChange={update('password')}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            minLength={8}
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            required
          />
        </label>
        {error && <p className="alert error">{error}</p>}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Register'}
        </button>
      </form>
      <p className="footer-link">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
