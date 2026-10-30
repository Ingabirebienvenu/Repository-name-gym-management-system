import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerMember } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/common/AuthShell';

function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    date_of_birth: '',
    membership_type: 'Basic',
  });
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
      const res = await registerMember(formData);
      // Auto-login right after registering
      loginUser({
        token: res.data.token,
        role: res.data.role,
        user: { id: res.data.user_id, first_name: formData.first_name, last_name: formData.last_name, email: formData.email },
      });
      navigate('/member');
    } catch (err) {
      if (err.response?.data?.error) setError(err.response.data.error);
      else if (!err.response) setError('Cannot reach the server. Check that the backend is running and try again.');
      else setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join in a minute and start booking classes."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      {error && <div className="au-error" role="alert">{error}</div>}

      <form className="au-form" onSubmit={handleSubmit}>
        <div className="au-row2">
          <div className="au-field">
            <label htmlFor="first_name">First name</label>
            <input id="first_name" name="first_name" autoComplete="given-name" value={formData.first_name} onChange={handleChange} required autoFocus />
          </div>
          <div className="au-field">
            <label htmlFor="last_name">Last name</label>
            <input id="last_name" name="last_name" autoComplete="family-name" value={formData.last_name} onChange={handleChange} required />
          </div>
        </div>

        <div className="au-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" autoComplete="email" placeholder="you@example.com"
                 value={formData.email} onChange={handleChange} required />
        </div>

        <div className="au-field">
          <label htmlFor="password">Password</label>
          <div className="au-input has-toggle">
            <input id="password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password"
                   placeholder="At least 6 characters" value={formData.password} onChange={handleChange} required minLength={6} />
            <button type="button" className="au-toggle" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="au-row2">
          <div className="au-field">
            <label htmlFor="phone">Phone <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
            <input id="phone" name="phone" autoComplete="tel" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="au-field">
            <label htmlFor="date_of_birth">Date of birth <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
            <input id="date_of_birth" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
          </div>
        </div>

        <div className="au-field">
          <label htmlFor="membership_type">Membership</label>
          <select id="membership_type" name="membership_type" value={formData.membership_type} onChange={handleChange}>
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>
        </div>

        <button type="submit" className="au-btn" disabled={loading}>
          {loading && <span className="au-spin" />}
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}

export default Register;