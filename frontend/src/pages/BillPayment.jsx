import { useState } from 'react';
import { api } from '../api';
import AppLayout from '../components/AppLayout';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/AuthContext';
import { formatBdt } from '../utils/money';

const BILL_TYPES = ['Electricity', 'Gas', 'Water', 'Internet', 'Mobile Recharge'];

export default function BillPayment() {
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    billType: 'Electricity',
    accountNo: '',
    amount: '',
  });
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
      const data = await api('/banking/bill-pay', {
        method: 'POST',
        auth: true,
        body: {
          billType: form.billType,
          accountNo: form.accountNo,
          amount: Number(form.amount),
        },
      });
      setMessage(data.message);
      setBalance(data.balance);
      setUser(data.user);
      setForm({ billType: 'Electricity', accountNo: '', amount: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout>
      <PageShell
        eyebrow="Pay"
        title="Bill Payment"
        subtitle="Clear electricity, gas, water, internet or mobile bills."
        accent="amber"
      >
        {message && <p className="alert info">{message}</p>}
        {error && <p className="alert error">{error}</p>}
        {balance != null && (
          <p className="success-line">New balance · <strong>{formatBdt(balance)}</strong></p>
        )}
        <form className="stack narrow fancy-form" onSubmit={onSubmit}>
          <label>
            Bill type
            <select
              value={form.billType}
              onChange={(e) => setForm((p) => ({ ...p, billType: e.target.value }))}
            >
              {BILL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Account / consumer no.
            <input
              value={form.accountNo}
              onChange={(e) => setForm((p) => ({ ...p, accountNo: e.target.value }))}
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
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Paying…' : 'Pay bill'}
          </button>
        </form>
      </PageShell>
    </AppLayout>
  );
}
