import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context.js';
export default function ProtectedRoute() {
  const { user, loading, error, restore } = useAuth();
  if (loading) return <main className="auth-status" role="status"><span className="logo-mark">c<span>↗</span></span><h1>Opening your workspace…</h1><p>Just a moment while we check your session.</p></main>;
  if (error) return <main className="auth-status" role="alert"><h1>Let’s try that again.</h1><p>{error}</p><button className="btn primary" onClick={restore}>Try again</button></main>;
  return user ? <Outlet /> : <Navigate to="/signin" replace />;
}
