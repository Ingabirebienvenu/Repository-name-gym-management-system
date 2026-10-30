import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/common/AuthShell';

const MailIcon = () => (
  <svg className="au-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
  </svg>
);
const LockIcon = () => (
  <svg className="au-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ ...formData, email: formData.email.trim() });
      loginUser(res.data);

      // Redirect based on role
      if (res.data.role === 'admin') navigate('/admin');
      else if (res.data.role === 'trainer') navigate('/trainer');
      else navigate('/member');
    } catch (err) {
      if (err.response?.data?.error) setError(err.response.data.error);
      else if (!err.response) setError('Cannot reach the server. Check that the backend is running and try again.');
      else setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Gym account."
      footer={<>New to Gym Manager? <Link to="/register">Create an account</Link></>}
    >
      {error && <div className="au-error" role="alert">{error}</div>}

      <form className="au-form" onSubmit={handleSubmit}>
        <div className="au-field">
          <label htmlFor="email">Email</label>
          <div className="au-input has-ico">
            <MailIcon />
            <input id="email" type="email" name="email" autoComplete="email" placeholder="you@example.com"
                   value={formData.email} onChange={handleChange} required autoFocus />
          </div>
        </div>

        <div className="au-field">
          <label htmlFor="password">Password</label>
          <div className="au-input has-ico has-toggle">
            <LockIcon />
            <input id="password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password"
                   placeholder="Enter your password" value={formData.password} onChange={handleChange} required />
            <button type="button" className="au-toggle" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button type="submit" className="au-btn" disabled={loading}>
          {loading && <span className="au-spin" />}
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}

export default Login;