import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import AppLayout from '../components/AppLayout';
import PageShell from '../components/PageShell';
import { formatBdt } from '../utils/money';

export default function Others() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/banking/transactions', { auth: true })
      .then((data) => setTransactions(data.transactions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <PageShell
        eyebrow="More"
        title="Others"
        subtitle="Mini statement and quick account shortcuts."
        accent="slate"
      >
        <div className="others-links">
          <Link className="btn ghost" to="/security">Security & devices</Link>
          <Link className="btn ghost" to="/check-balance">Check balance</Link>
        </div>

        <h2 className="subhead">Mini statement</h2>
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="alert error">{error}</p>}
        <ul className="list statement-list">
          {transactions.map((t) => (
            <li key={t.id}>
              <div>
                <strong>{t.type.replace(/_/g, ' ')}</strong>
                <p className="muted">
                  {[t.note, t.counterparty].filter(Boolean).join(' · ') || '—'}
                </p>
                <p className="muted small">{new Date(t.createdAt).toLocaleString()}</p>
              </div>
              <span className={t.amount >= 0 ? 'pill ok' : 'pill bad'}>
                {t.amount >= 0 ? '+' : ''}{formatBdt(t.amount)}
              </span>
            </li>
          ))}
          {!loading && !transactions.length && (
            <li className="muted">No transactions yet. Add money to get started.</li>
          )}
        </ul>
      </PageShell>
    </AppLayout>
  );
}
