import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const DEMO_CREDENTIALS = [
  { label: 'Patient',  icon: '👤', email: 'patient@hospital.com',  role: 'patient'  },
  { label: 'Doctor',   icon: '👨⚕️', email: 'doctor@hospital.com',   role: 'doctor'   },
  { label: 'Admin',    icon: '🛡️', email: 'admin@hospital.com',    role: 'admin'    },
];

const FEATURES = [
  { icon: '🔒', title: 'Bank-Grade Security',    desc: 'JWT auth & encrypted data storage'     },
  { icon: '📅', title: 'Smart Scheduling',       desc: 'AI-assisted appointment management'    },
  { icon: '📋', title: 'Digital Health Records', desc: 'Instant access to patient history'     },
  { icon: '☁️', title: 'Cloud-Powered',          desc: 'Available 24/7 from any device'        },
];

const STATS = [
  { value: '10K+', label: 'Patients Served' },
  { value: '500+', label: 'Doctors'         },
  { value: '99.9%', label: 'Uptime'         },
];

function EyeIcon({ open }) {
  return open
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}

function Login({ onLogin }) {
  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [remember, setRemember]     = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fillDemo = (cred) => {
    setActiveDemo(cred.role);
    setFormData({ email: cred.email, password: 'Password@123' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      onLogin(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        {/* Decorative blobs */}
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />

        <div className="auth-left-content">
          {/* Brand */}
          <div className="auth-brand">
            <div className="auth-brand-icon">🏥</div>
            <div>
              <div className="auth-brand-name">MediCare HMS</div>
              <div className="auth-brand-tagline">Hospital Management System</div>
            </div>
          </div>

          {/* Headline */}
          <div className="auth-headline">
            <h2>Modern Healthcare<br />Management Platform</h2>
            <p>Streamlining appointments, records, and patient care with cutting-edge cloud technology.</p>
          </div>

          {/* Feature list */}
          <div className="auth-features">
            {FEATURES.map(f => (
              <div key={f.title} className="auth-feature-item">
                <div className="auth-feature-icon">{f.icon}</div>
                <div>
                  <div className="auth-feature-title">{f.title}</div>
                  <div className="auth-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="auth-stats-row">
            {STATS.map(s => (
              <div key={s.label} className="auth-stat">
                <div className="auth-stat-value">{s.value}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Trust badge */}
          <div className="auth-trust">
            <span className="auth-trust-dot" />
            Trusted by healthcare professionals worldwide
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          {/* Header */}
          <div className="auth-form-header">
            <span className="auth-eyebrow">Welcome back</span>
            <h1 className="auth-title">Sign in to your account</h1>
            <p className="auth-subtitle">Enter your credentials to access the dashboard</p>
          </div>

          {/* Demo quick-fill */}
          <div className="auth-demo-section">
            <p className="auth-demo-label">Quick demo access</p>
            <div className="auth-demo-btns">
              {DEMO_CREDENTIALS.map(c => (
                <button
                  key={c.role}
                  type="button"
                  className={`auth-demo-btn ${activeDemo === c.role ? 'active' : ''}`}
                  onClick={() => fillDemo(c)}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
            {activeDemo && (
              <p className="auth-demo-hint">
                ✓ Filled with <strong>{activeDemo}</strong> credentials — password: <code>Password@123</code>
              </p>
            )}
          </div>

          <div className="auth-divider"><span>or sign in manually</span></div>

          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email */}
            <div className="auth-field">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@hospital.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <div className="auth-field-row">
                <label>Password</label>
              </div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔑</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPass(p => !p)}>
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="auth-remember">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="auth-checkbox"
                />
                <span className="auth-checkbox-custom" />
                Remember me for 30 days
              </label>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner-row">
                  <span className="auth-btn-spinner" /> Signing in…
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Create one free</Link></p>
          </div>

          {/* Security note */}
          <div className="auth-security-note">
            <span>🔒</span>
            <span>Secured with 256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
