import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Register({ onLogin }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'patient', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      onLogin(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
        padding: '60px 48px', color: 'white'
      }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>🏥</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.03em', textAlign: 'center' }}>
          MediCare HMS
        </h1>
        <p style={{ fontSize: 15, opacity: 0.85, textAlign: 'center', lineHeight: 1.7, maxWidth: 280 }}>
          Join thousands of patients and healthcare professionals managing care smarter.
        </p>
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 280 }}>
          {['Patient', 'Doctor', 'Admin'].map((role, i) => (
            <div key={role} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 18px', fontSize: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{['👤 Patient', '👨‍⚕️ Doctor', '🛡️ Admin'][i]}</div>
              <div style={{ opacity: 0.8, fontSize: 12 }}>{['Book & track appointments', 'Manage patient records', 'Full system oversight'][i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#fff', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4f46e5', marginBottom: 8 }}>
            Get started
          </p>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', marginBottom: 32, letterSpacing: '-0.03em' }}>
            Create your account
          </h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Dr. Jane Smith" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@hospital.com" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1 (555) 000-0000" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange} required>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" placeholder="Min. 6 characters" />
            </div>
            <button type="submit" className="btn" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="auth-switch" style={{ marginTop: 28 }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
