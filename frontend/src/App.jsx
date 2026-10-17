import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AddMoney from './pages/AddMoney';
import BillPayment from './pages/BillPayment';
import CheckBalance from './pages/CheckBalance';
import Dashboard from './pages/Dashboard';
import FundTransfer from './pages/FundTransfer';
import Login from './pages/Login';
import Others from './pages/Others';
import Register from './pages/Register';
import Security from './pages/Security';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center muted">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center muted">Loading…</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Guest><Login /></Guest>} />
      <Route path="/register" element={<Guest><Register /></Guest>} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/check-balance" element={<Protected><CheckBalance /></Protected>} />
      <Route path="/add-money" element={<Protected><AddMoney /></Protected>} />
      <Route path="/fund-transfer" element={<Protected><FundTransfer /></Protected>} />
      <Route path="/bill-payment" element={<Protected><BillPayment /></Protected>} />
      <Route path="/others" element={<Protected><Others /></Protected>} />
      <Route path="/security" element={<Protected><Security /></Protected>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
