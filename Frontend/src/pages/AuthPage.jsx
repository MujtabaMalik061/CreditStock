import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../auth/context.js';

export default function AuthPage({ mode }) {
  const signup = mode === 'signup';
  const { user, loading, authenticate } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (signup && values.password !== values.confirmPassword) { setError('Your passwords don’t match. Please check them.'); return; }
    if (signup && new TextEncoder().encode(values.password).length > 72) { setError('Choose a password with at most 72 bytes.'); return; }
    setBusy(true); setError('');
    try { await authenticate(mode, values); }
    catch (err) { setError(err.status ? err.message : 'We couldn’t connect. Please try again.'); }
    finally { setBusy(false); }
  }
  if (user && !loading) return <Navigate to="/app" replace />;
  return <div className="auth-page">
    <aside className="auth-story"><Link to="/" className="wordmark"><span className="logo-mark">c<span>↗</span></span>CreditStock.</Link><div className="auth-story-copy"><span className="landing-eyebrow">YOUR EVERYDAY BUSINESS COMPANION</span><h1>A little clarity.<br/>A lot more <em>possibility.</em></h1><p>Keep your stock, sales, and customer credit in order. Make more room for the business you’re building.</p><div className="auth-benefits">{[['inventory', 'Every product in its place.'], ['wallet', 'Every balance accounted for.'], ['reports', 'Every day a clearer picture.']].map(([icon, label]) => <div key={icon}><Icon name={icon}/><span>{label}</span></div>)}</div></div><span className="auth-story-footer">STOCK. SELL. GROW.</span></aside>
    <main className="auth-form-panel"><Link to="/" className="auth-back">← Back to CreditStock</Link><div className="auth-form-content"><span className="landing-eyebrow">{signup ? 'YOUR NEXT CHAPTER' : 'RIGHT WHERE YOU LEFT OFF'}</span><h2>{signup ? 'Make yourself at home.' : 'Welcome back.'}</h2><p>{signup ? 'Create your account and give your shop a clearer view.' : 'Sign in to keep your shop moving.'}</p>
      <form onSubmit={handleSubmit} className="auth-form">
        {signup && <><label className="field"><span>Your name</span><input name="name" autoComplete="name" placeholder="e.g. Ayesha Khan" required maxLength={80} disabled={busy}/></label><label className="field"><span>Shop name</span><input name="shopName" autoComplete="organization" placeholder="e.g. The Corner Store" required maxLength={100} disabled={busy}/></label></>}
        <label className="field"><span>Email address</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} disabled={busy}/></label>
        <div className="field"><label htmlFor="auth-password">Password</label><div className="password-field"><input id="auth-password" name="password" type={visible ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? 'Create a strong password' : 'Enter your password'} minLength={signup ? 8 : undefined} maxLength={72} required disabled={busy} aria-describedby={signup ? 'password-help' : undefined}/><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>{visible ? 'Hide' : 'Show'}</button></div></div>
        {signup && <><p id="password-help" className="auth-hint">Use at least 8 characters. A longer, unique password is best.</p><label className="field"><span>Confirm password</span><input name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter your password again" required maxLength={72} disabled={busy}/></label></>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="landing-button auth-submit" type="submit" disabled={busy || loading}>{busy ? (signup ? 'Creating your account…' : 'Signing you in…') : (signup ? 'Create your account' : 'Sign in')}<Icon name="arrow" size={18}/></button>
      </form>
      <p className="auth-switch">{signup ? 'Already have an account?' : 'New to CreditStock?'} <Link to={signup ? '/signin' : '/signup'}>{signup ? 'Sign in' : 'Create an account'}</Link></p>
      <div className="auth-reassurance"><Icon name="check" size={15}/><span>Your shop. Your workspace. All in one place.</span></div>
    </div><span className="auth-copyright">© {new Date().getFullYear()} CreditStock</span></main>
  </div>;
}
