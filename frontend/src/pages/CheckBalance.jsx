import { useEffect, useState } from 'react';
import { api } from '../api';
import AppLayout from '../components/AppLayout';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/AuthContext';
import { formatBdt } from '../utils/money';

export default function CheckBalance() {
  const { user, setUser } = useAuth();
  const [balance, setBalance] = useState(user?.balance ?? 0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/banking/balance', { auth: true })
      .then((data) => {
        setBalance(data.balance);
        setUser(data.user);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [setUser]);

  return (
    <AppLayout>
      <PageShell
        eyebrow="Account"
        title="Check Balance"
        subtitle="Live balance for your SecureBank account."
        accent="teal"
      >
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="alert error">{error}</p>}
        {!loading && !error && (
          <div className="result-hero">
            <p className="result-label">Current balance</p>
            <p className="balance-big pulse-in">{formatBdt(balance)}</p>
            <p className="muted small">Account · {user.email}</p>
          </div>
        )}
      </PageShell>
    </AppLayout>
  );
}
