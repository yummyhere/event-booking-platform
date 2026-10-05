import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/events', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout">
      <div className="auth-aside register-aside"><span className="aside-symbol">g.</span><p>Good things<br />start with hello.</p><span className="aside-caption">COME AS YOU ARE. BRING A FRIEND.</span></div>
      <section className="auth-panel">
        <Link className="back-link" to="/events">← Back to events</Link>
        <p className="eyebrow">A SEAT AT THE TABLE</p>
        <h1>Let's make plans.</h1>
        <p className="auth-intro">Create an account and find your next favorite gathering.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>Your name<input type="text" autoComplete="name" required minLength="2" maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Alex Morgan" /></label>
          <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
          <label>Password<input type="password" autoComplete="new-password" required minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-full" disabled={loading}>{loading ? 'Creating your account…' : 'Create account'} <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">Already part of the community? <Link to="/login">Log in</Link></p>
      </section>
    </main>
  );
}