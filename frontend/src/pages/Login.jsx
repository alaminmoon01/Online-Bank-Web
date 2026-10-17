import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needsOTP, setNeedsOTP] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const result = await login({
        email,
        password,
        otp: needsOTP ? otp : undefined,
        twoFactorCode: needs2FA ? twoFactorCode : undefined,
      });

      if (result.requiresOTP && !result.token) {
        setNeedsOTP(true);
        if (result.requires2FA) {
          setNeeds2FA(true);
          setInfo(result.message);
        } else {
          setNeeds2FA(false);
          setInfo(
            result.demoOtp
              ? `${result.message} Demo OTP: ${result.demoOtp}`
              : result.message,
          );
        }
        return;
      }

      if (result.requires2FA && !result.token) {
        setNeedsOTP(true);
        setNeeds2FA(true);
        setInfo(result.message);
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      if (err.data?.requiresOTP) setNeedsOTP(true);
      if (err.data?.requires2FA) setNeeds2FA(true);
      if (err.message?.includes('expired OTP')) {
        setNeedsOTP(false);
        setNeeds2FA(false);
        setOtp('');
        setTwoFactorCode('');
      }
    } finally {
      setBusy(false);
    }
  }

  function resetSteps() {
    setNeedsOTP(false);
    setNeeds2FA(false);
    setOtp('');
    setTwoFactorCode('');
    setInfo('');
    setError('');
  }

  return (
    <AuthShell title="Sign in" subtitle="Access your account with email, password, and OTP.">
      <form className="stack" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={needsOTP}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={needsOTP}
          />
        </label>
        {needsOTP && (
          <label>
            OTP code
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </label>
        )}
        {needs2FA && (
          <label>
            Authenticator 2FA code
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Authenticator code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              required
            />
          </label>
        )}
        {error && <p className="alert error">{error}</p>}
        {info && <p className="alert info">{info}</p>}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : needsOTP ? 'Verify & sign in' : 'Sign in'}
        </button>
        {needsOTP && (
          <button type="button" className="btn ghost" onClick={resetSteps}>
            Back
          </button>
        )}
      </form>
      <p className="footer-link">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthShell>
  );
}
