import { useState } from 'react';
import { api } from '../api';
import AppLayout from '../components/AppLayout';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/AuthContext';
import { formatBdt } from '../utils/money';

export default function AddMoney() {
  const { setUser } = useAuth();
  const [form, setForm] = useState({ amount: '', note: '' });
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
      const data = await api('/banking/add-money', {
        method: 'POST',
        auth: true,
        body: { amount: Number(form.amount), note: form.note },
      });
      setMessage(data.message);
      setBalance(data.balance);
      setUser(data.user);
      setForm({ amount: '', note: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout>
      <PageShell
        eyebrow="Deposit"
        title="Add Money"
        subtitle="Top up your wallet in a few seconds."
        accent="green"
      >
        {message && <p className="alert info">{message}</p>}
        {error && <p className="alert error">{error}</p>}
        {balance != null && (
          <p className="success-line">New balance · <strong>{formatBdt(balance)}</strong></p>
        )}
        <form className="stack narrow fancy-form" onSubmit={onSubmit}>
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
              placeholder="Salary / cash deposit"
            />
          </label>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Processing…' : 'Add money'}
          </button>
        </form>
      </PageShell>
    </AppLayout>
  );
}
