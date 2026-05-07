import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', formData);
      onLogin(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left branding panel */}
      <div style={{
        background: 'linear-gradient(160deg, #4f46e5 0%, #7c3aed 40%, #0ea5e9 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px', color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>🏥</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.03em', textAlign: 'center' }}>
          MediCare HMS
        </h1>
        <p style={{ fontSize: 15, opacity: 0.85, textAlign: 'center', lineHeight: 1.7, maxWidth: 280 }}>
          Streamlining hospital appointments and patient records with modern cloud technology.
        </p>
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 280 }}>
          {['Secure Patient Records', 'Smart Appointment Booking', 'Role-Based Access Control'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, opacity: 0.9 }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4f46e5', marginBottom: 8 }}>
            Welcome back
          </p>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', marginBottom: 32, letterSpacing: '-0.03em' }}>
            Sign in to your account
          </h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@hospital.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Enter your password" />
            </div>
            <button type="submit" className="btn" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="auth-switch" style={{ marginTop: 28 }}>
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
