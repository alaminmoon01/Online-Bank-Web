import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ children }) {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/dashboard" className="brand">SecureBank</Link>
        <nav>
          <NavLink to="/dashboard" end>Dashboard</NavLink>
          <NavLink to="/security">Security</NavLink>
          <button type="button" className="btn ghost compact" onClick={logout}>
            Log out
          </button>
        </nav>
      </header>
      <main key={location.pathname} className="content page-enter">
        {children}
      </main>
    </div>
  );
}
