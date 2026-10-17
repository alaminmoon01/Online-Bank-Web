import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { formatBdt } from '../utils/money';

const FEATURES = [
  {
    path: '/check-balance',
    title: 'Check Balance',
    desc: 'View your current account balance',
    icon: '◎',
    tone: 'a',
  },
  {
    path: '/add-money',
    title: 'Add Money',
    desc: 'Deposit funds instantly',
    icon: '+',
    tone: 'b',
  },
  {
    path: '/fund-transfer',
    title: 'Fund Transfer',
    desc: 'Send money to another account',
    icon: '↗',
    tone: 'c',
  },
  {
    path: '/bill-payment',
    title: 'Bill Payment',
    desc: 'Pay utilities & recharges',
    icon: '⌁',
    tone: 'd',
  },
  {
    path: '/others',
    title: 'Others',
    desc: 'Statement & more services',
    icon: '⋯',
    tone: 'e',
  },
];

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [balance, setBalance] = useState(user?.balance ?? 0);
  const [peek, setPeek] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    api('/banking/balance', { auth: true })
      .then((data) => {
        setBalance(data.balance);
        setUser(data.user);
      })
      .catch(() => {});

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [setUser]);

  function peekBalance() {
    setPeek(true);
    setLeaving(false);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setLeaving(true);
      hideTimer.current = setTimeout(() => {
        setPeek(false);
        setLeaving(false);
      }, 320);
    }, 2200);
  }

  const topRow = FEATURES.slice(0, 3);
  const bottomRow = FEATURES.slice(3);

  return (
    <AppLayout>
      <section className="hero-block dash-hero">
        <div className="dash-intro">
          <p className="eyebrow">Dashboard</p>
          <h1>Welcome, {user.fullName}</h1>
          <p className="lede">Pick a service to continue. Your balance stays private until you peek.</p>
        </div>

        <button
          type="button"
          className={`balance-vault ${peek ? 'is-open' : ''} ${leaving ? 'is-leaving' : ''}`}
          onClick={peekBalance}
          aria-label="Peek available balance"
        >
          <div className="vault-shine" aria-hidden="true" />
          <div className="vault-top">
            <span>Available balance</span>
            <span className={`vault-eye ${peek && !leaving ? 'open' : ''}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                {peek && !leaving ? (
                  <path
                    fill="currentColor"
                    d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9z"
                  />
                ) : (
                  <path
                    fill="currentColor"
                    d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-3.89-6-7-11-7-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 3.89 6 7 11 7 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                  />
                )}
              </svg>
            </span>
          </div>
          <div className="vault-amount-wrap">
            <strong className={`vault-dots ${peek ? 'hide' : ''}`}>••••••</strong>
            <strong className={`vault-amount ${peek ? 'show' : ''} ${leaving ? 'fade' : ''}`}>
              {formatBdt(balance)}
            </strong>
          </div>
          <span className="vault-hint">
            {peek && !leaving ? 'Auto-hides shortly' : 'Tap to reveal'}
          </span>
        </button>
      </section>

      <section className="feature-board">
        <div className="feature-row top">
          {topRow.map((f, i) => (
            <Link
              key={f.path}
              to={f.path}
              className={`feature-tile tone-${f.tone}`}
              style={{ '--i': i }}
            >
              <span className="feature-icon" aria-hidden="true">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="feature-go">Open →</span>
            </Link>
          ))}
        </div>
        <div className="feature-row bottom">
          {bottomRow.map((f, i) => (
            <Link
              key={f.path}
              to={f.path}
              className={`feature-tile tone-${f.tone}`}
              style={{ '--i': i + 3 }}
            >
              <span className="feature-icon" aria-hidden="true">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="feature-go">Open →</span>
            </Link>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
