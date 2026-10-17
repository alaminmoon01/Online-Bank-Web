import { useState } from 'react';
import { api } from '../api';
import AppLayout from '../components/AppLayout';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/AuthContext';
import { formatBdt } from '../utils/money';

export default function FundTransfer() {
  const { setUser } = useAuth();
  const [form, setForm] = useState({ toEmail: '', amount: '', note: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/banking/transfer', {
        method: 'POST',
        auth: true,
        body: {
          toEmail: form.toEmail,
          amount: Number(form.amount),
          note: form.note,
        },
      });
      setMessage(data.message);
      setBalance(data.balance);
      setUser(data.user);
      setForm({ toEmail: '', amount: '', note: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout>
      <PageShell
        eyebrow="Send"
        title="Fund Transfer"
        subtitle="Transfer to another SecureBank email account."
        accent="blue"
      >
        {message && <p className="alert info">{message}</p>}
        {error && <p className="alert error">{error}</p>}
        {balance != null && (
          <p className="success-line">New balance · <strong>{formatBdt(balance)}</strong></p>
        )}
        <form className="stack narrow fancy-form" onSubmit={onSubmit}>
          <label>
            Recipient email
            <input
              type="email"
              value={form.toEmail}
              onChange={(e) => setForm((p) => ({ ...p, toEmail: e.target.value }))}
              required
            />
          </label>
          <label>
            Amount (BDT)
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              required
            />
          </label>
          <label>
            Note <span className="optional">(optional)</span>
            <input
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            />
          </label>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Transfer now'}
          </button>
        </form>
      </PageShell>
    </AppLayout>
  );
}
