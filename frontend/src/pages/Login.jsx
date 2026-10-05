import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const destination = location.state?.from?.pathname || '/events';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not sign you in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout">
      <div className="auth-aside"><span className="aside-symbol">g.</span><p>Make room for<br />good company.</p><span className="aside-caption">YOUR NEIGHBORHOOD, IN GOOD COMPANY</span></div>
      <section className="auth-panel">
        <Link className="back-link" to="/events">← Back to events</Link>
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Come on in.</h1>
        <p className="auth-intro">Pick up where you left off. Your next good day is waiting.</p>
        {location.state?.message && <p className="form-hint">{location.state.message}</p>}
        <form className="auth-form" onSubmit={submit}>
          <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
          <label>Password<input type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your password" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-full" disabled={loading}>{loading ? 'Signing you in…' : 'Log in'} <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">New around here? <Link to="/register">Join the community</Link></p>
      </section>
    </main>
  );
}