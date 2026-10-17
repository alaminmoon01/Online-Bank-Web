import { Link } from 'react-router-dom';

export default function PageShell({
  eyebrow = 'SecureBank',
  title,
  subtitle,
  accent = 'teal',
  children,
}) {
  return (
    <div className={`service-page accent-${accent}`}>
      <div className="service-glow" aria-hidden="true" />
      <section className="service-card">
        <Link to="/dashboard" className="back-link">
          <span className="back-arrow" aria-hidden="true">←</span>
          Back to dashboard
        </Link>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {subtitle && <p className="lede service-lede">{subtitle}</p>}
        <div className="service-body">{children}</div>
      </section>
    </div>
  );
}
