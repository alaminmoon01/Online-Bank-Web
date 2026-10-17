import { Link } from 'react-router-dom';

export default function AuthShell({ children, title, subtitle }) {
  return (
    <div className="auth-layout">
      <aside className="auth-visual" aria-hidden="true">
        <div className="auth-visual-inner">
          <p className="brand">SecureBank</p>
          <h1>Your money, guarded at every step.</h1>
          <p className="lede">
            Module 1 covers registration, login, two-factor authentication,
            lockout protection, and device monitoring.
          </p>
        </div>
      </aside>
      <main className="auth-panel">
        <div className="auth-panel-inner">
          <Link to="/login" className="brand mobile-brand">SecureBank</Link>
          <h2>{title}</h2>
          <p className="subtitle">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
