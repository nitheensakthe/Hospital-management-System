import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

/* ── Constants ── */
const ROLES = [
  { value: 'patient', icon: '👤', title: 'Patient',  desc: 'Book & track your appointments',      color: '#06b6d4' },
  { value: 'doctor',  icon: '👨‍⚕️', title: 'Doctor',   desc: 'Manage records & patient care',       color: '#4f46e5' },
  { value: 'admin',   icon: '🛡️', title: 'Admin',    desc: 'Full system access & oversight',      color: '#7c3aed' },
];

const STEPS = [
  { num: 1, label: 'Personal Info',   icon: '👤' },
  { num: 2, label: 'Role & Security', icon: '🔒' },
  { num: 3, label: 'Review',          icon: '✅' },
];

const LEFT_PANELS = [
  {
    headline: 'Tell us about yourself',
    sub: 'We need a few basic details to set up your account.',
    items: [
      { icon: '⚡', title: 'Quick Setup',       desc: 'Ready in under 2 minutes'         },
      { icon: '🔒', title: 'Private & Secure',  desc: 'Your data is always encrypted'    },
      { icon: '📱', title: 'Any Device',        desc: 'Access from anywhere, anytime'    },
    ],
  },
  {
    headline: 'Choose your role & secure your account',
    sub: 'Your role determines what you can access inside the system.',
    items: [
      { icon: '👤', title: 'Patient',  desc: 'Book & track appointments'    },
      { icon: '👨‍⚕️', title: 'Doctor',   desc: 'Manage patient records'       },
      { icon: '🛡️', title: 'Admin',    desc: 'Full system oversight'         },
    ],
  },
  {
    headline: 'Almost there — review your details',
    sub: 'Double-check everything before creating your account.',
    items: [
      { icon: '✅', title: 'Verified Info',    desc: 'All fields validated'             },
      { icon: '🚀', title: 'Instant Access',   desc: 'Login right after registration'   },
      { icon: '🆓', title: 'Free Forever',     desc: 'No credit card required'          },
    ],
  },
];

const STATS = [
  { value: '10K+',  label: 'Patients'  },
  { value: '500+',  label: 'Doctors'   },
  { value: '99.9%', label: 'Uptime'    },
];

/* ── Helpers ── */
function EyeIcon({ open }) {
  return open
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6)           score++;
  if (pw.length >= 10)          score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  if (score <= 1) return { score, label: 'Weak',       color: '#ef4444' };
  if (score <= 2) return { score, label: 'Fair',       color: '#f59e0b' };
  if (score <= 3) return { score, label: 'Good',       color: '#06b6d4' };
  if (score <= 4) return { score, label: 'Strong',     color: '#10b981' };
  return              { score, label: 'Very Strong',  color: '#4f46e5' };
}

/* ── Sub-components ── */
function StepIndicator({ current }) {
  return (
    <div className="reg-steps">
      {STEPS.map((s, i) => {
        const done    = current > s.num;
        const active  = current === s.num;
        return (
          <React.Fragment key={s.num}>
            <div className={`reg-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
              <div className="reg-step-circle">
                {done ? '✓' : s.num}
              </div>
              <span className="reg-step-label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`reg-step-line ${done ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function FieldWrap({ label, icon, error, success, children }) {
  return (
    <div className={`auth-field ${error ? 'field-error' : ''} ${success ? 'field-success' : ''}`}>
      <label>{label}</label>
      <div className="auth-input-wrap">
        <span className="auth-input-icon">{icon}</span>
        {children}
        {success && <span className="field-tick">✓</span>}
        {error   && <span className="field-x">✕</span>}
      </div>
      {error && <p className="field-error-msg">{error}</p>}
    </div>
  );
}

function ReviewRow({ icon, label, value }) {
  return (
    <div className="reg-review-row">
      <span className="reg-review-icon">{icon}</span>
      <div>
        <div className="reg-review-label">{label}</div>
        <div className="reg-review-value">{value}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   REGISTER
══════════════════════════════════════════ */
function Register({ onLogin }) {
  const [step, setStep]         = useState(1);
  const [done, setDone]         = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'patient', password: '', confirm: '' });
  const [touched, setTouched]   = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [terms, setTerms]       = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const set = (field, val) => {
    setError('');
    setFormData(f => ({ ...f, [field]: val }));
    setTouched(t => ({ ...t, [field]: true }));
  };

  const blur = (field) => setTouched(t => ({ ...t, [field]: true }));

  /* ── Validation ── */
  const errs = useMemo(() => {
    const e = {};
    if (touched.name    && !formData.name.trim())                          e.name    = 'Full name is required';
    if (touched.email   && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email address';
    if (touched.phone   && !/^\+?[\d\s\-()]{7,}$/.test(formData.phone))   e.phone   = 'Enter a valid phone number';
    if (touched.password && formData.password.length < 6)                  e.password = 'Password must be at least 6 characters';
    if (touched.confirm  && formData.confirm !== formData.password)         e.confirm  = 'Passwords do not match';
    return e;
  }, [formData, touched]);

  const isValid = (fields) => fields.every(f => formData[f] && !errs[f]);

  const pwStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  /* ── Step navigation ── */
  const nextStep = () => {
    if (step === 1) {
      setTouched(t => ({ ...t, name: true, email: true, phone: true }));
      if (!isValid(['name', 'email', 'phone'])) return;
    }
    if (step === 2) {
      setTouched(t => ({ ...t, password: true, confirm: true }));
      if (!isValid(['password', 'confirm'])) return;
      if (!terms) { setError('Please accept the terms & conditions'); return; }
    }
    setError('');
    setStep(s => s + 1);
  };

  const prevStep = () => { setError(''); setStep(s => s - 1); };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: formData.name, email: formData.email,
        phone: formData.phone, role: formData.role, password: formData.password
      });
      onLogin(res.data.token, res.data.user);
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 2200);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  /* ── Progress ── */
  const allFields = [formData.name, formData.email, formData.phone, formData.password, formData.confirm];
  const progress  = Math.round((allFields.filter(Boolean).length / allFields.length) * 100);

  const panel = LEFT_PANELS[step - 1];
  const selectedRole = ROLES.find(r => r.value === formData.role);

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-blob auth-blob-1" /><div className="auth-blob auth-blob-2" /><div className="auth-blob auth-blob-3" />
          <div className="auth-left-content">
            <div className="auth-brand">
              <div className="auth-brand-icon">🏥</div>
              <div><div className="auth-brand-name">MediCare HMS</div><div className="auth-brand-tagline">Hospital Management System</div></div>
            </div>
            <div className="auth-headline">
              <h2>Welcome aboard,<br />{formData.name.split(' ')[0]}!</h2>
              <p>Your account has been created. Redirecting you to the dashboard…</p>
            </div>
            <div className="auth-stats-row">
              {STATS.map(s => (
                <div key={s.label} className="auth-stat">
                  <div className="auth-stat-value">{s.value}</div>
                  <div className="auth-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="reg-success">
            <div className="reg-success-ring">
              <div className="reg-success-icon">✓</div>
            </div>
            <h2>Account Created!</h2>
            <p>Welcome to MediCare HMS, <strong>{formData.name}</strong>.</p>
            <p className="reg-success-sub">You're signed in as a <strong>{formData.role}</strong>. Redirecting to your dashboard…</p>
            <div className="reg-success-bar">
              <div className="reg-success-fill" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        <div className="auth-blob auth-blob-1" /><div className="auth-blob auth-blob-2" /><div className="auth-blob auth-blob-3" />
        <div className="auth-left-content">
          {/* Brand */}
          <div className="auth-brand">
            <div className="auth-brand-icon">🏥</div>
            <div><div className="auth-brand-name">MediCare HMS</div><div className="auth-brand-tagline">Hospital Management System</div></div>
          </div>

          {/* Dynamic headline per step */}
          <div className="auth-headline" key={step}>
            <h2>{panel.headline}</h2>
            <p>{panel.sub}</p>
          </div>

          {/* Dynamic items per step */}
          <div className="auth-features" key={`f${step}`}>
            {panel.items.map(item => (
              <div key={item.title} className="auth-feature-item">
                <div className="auth-feature-icon">{item.icon}</div>
                <div>
                  <div className="auth-feature-title">{item.title}</div>
                  <div className="auth-feature-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="auth-stats-row">
            {STATS.map(s => (
              <div key={s.label} className="auth-stat">
                <div className="auth-stat-value">{s.value}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="auth-trust">
            <span className="auth-trust-dot" />
            Trusted by healthcare professionals worldwide
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <div className="auth-form-wrap reg-form-wrap">

          {/* Header */}
          <div className="auth-form-header">
            <span className="auth-eyebrow">Step {step} of {STEPS.length}</span>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Join MediCare HMS — free, fast, and secure</p>
          </div>

          {/* Step indicator */}
          <StepIndicator current={step} />

          {/* Progress bar */}
          <div className="auth-progress-wrap">
            <div className="auth-progress-header">
              <span className="auth-progress-label">Profile completion</span>
              <span className="auth-progress-pct">{progress}%</span>
            </div>
            <div className="auth-progress-track">
              <div className="auth-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {error && <div className="auth-error"><span>⚠️</span> {error}</div>}

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <div className="reg-step-body">
              <FieldWrap label="Full Name" icon="👤" error={errs.name} success={touched.name && !errs.name && formData.name}>
                <input type="text" value={formData.name} placeholder="Dr. Jane Smith"
                  autoComplete="name" onChange={e => set('name', e.target.value)} onBlur={() => blur('name')} />
              </FieldWrap>

              <FieldWrap label="Email Address" icon="✉️" error={errs.email} success={touched.email && !errs.email && formData.email}>
                <input type="email" value={formData.email} placeholder="you@hospital.com"
                  autoComplete="email" onChange={e => set('email', e.target.value)} onBlur={() => blur('email')} />
              </FieldWrap>

              <FieldWrap label="Phone Number" icon="📞" error={errs.phone} success={touched.phone && !errs.phone && formData.phone}>
                <input type="tel" value={formData.phone} placeholder="+1 (555) 000-0000"
                  autoComplete="tel" onChange={e => set('phone', e.target.value)} onBlur={() => blur('phone')} />
              </FieldWrap>

              <div className="reg-nav">
                <div />
                <button type="button" className="auth-submit-btn reg-next-btn" onClick={nextStep}>
                  Continue → 
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Role & Security ── */}
          {step === 2 && (
            <div className="reg-step-body">
              {/* Role selector */}
              <div className="auth-field">
                <label>Select Your Role</label>
                <div className="reg-role-grid">
                  {ROLES.map(r => (
                    <button key={r.value} type="button"
                      className={`reg-role-card ${formData.role === r.value ? 'active' : ''}`}
                      style={{ '--role-color': r.color }}
                      onClick={() => set('role', r.value)}>
                      <span className="reg-role-icon">{r.icon}</span>
                      <span className="reg-role-title">{r.title}</span>
                      <span className="reg-role-desc">{r.desc}</span>
                      {formData.role === r.value && <span className="reg-role-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <FieldWrap label="Password" icon="🔑" error={errs.password} success={touched.password && !errs.password && formData.password}>
                <input type={showPass ? 'text' : 'password'} value={formData.password}
                  placeholder="Min. 6 characters" autoComplete="new-password"
                  onChange={e => set('password', e.target.value)} onBlur={() => blur('password')} />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPass(p => !p)}>
                  <EyeIcon open={showPass} />
                </button>
              </FieldWrap>

              {/* Password strength */}
              {formData.password && (
                <div className="auth-pw-strength" style={{ marginTop: -10, marginBottom: 16 }}>
                  <div className="auth-pw-bars">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="auth-pw-bar"
                        style={{ background: i <= pwStrength.score ? pwStrength.color : '#e2e8f0' }} />
                    ))}
                  </div>
                  <span className="auth-pw-label" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                </div>
              )}

              {/* Confirm password */}
              <FieldWrap label="Confirm Password" icon="🔑" error={errs.confirm} success={touched.confirm && !errs.confirm && formData.confirm}>
                <input type={showConf ? 'text' : 'password'} value={formData.confirm}
                  placeholder="Re-enter your password" autoComplete="new-password"
                  onChange={e => set('confirm', e.target.value)} onBlur={() => blur('confirm')} />
                <button type="button" className="auth-eye-btn" onClick={() => setShowConf(p => !p)}>
                  <EyeIcon open={showConf} />
                </button>
              </FieldWrap>

              {/* Terms */}
              <div className="reg-terms">
                <label className="auth-checkbox-label">
                  <input type="checkbox" className="auth-checkbox" checked={terms} onChange={e => { setTerms(e.target.checked); setError(''); }} />
                  <span className="auth-checkbox-custom" />
                  <span>I agree to the <a href="#terms" className="reg-terms-link">Terms of Service</a> and <a href="#privacy" className="reg-terms-link">Privacy Policy</a></span>
                </label>
              </div>

              <div className="reg-nav">
                <button type="button" className="reg-back-btn" onClick={prevStep}>← Back</button>
                <button type="button" className="auth-submit-btn reg-next-btn" onClick={nextStep}>
                  Review →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ── */}
          {step === 3 && (
            <div className="reg-step-body">
              <div className="reg-review-card">
                <div className="reg-review-header">
                  <span className="reg-review-avatar">{selectedRole?.icon}</span>
                  <div>
                    <div className="reg-review-name">{formData.name}</div>
                    <div className="reg-review-role-badge" style={{ background: selectedRole?.color }}>{formData.role}</div>
                  </div>
                </div>
                <div className="reg-review-body">
                  <ReviewRow icon="✉️" label="Email"  value={formData.email} />
                  <ReviewRow icon="📞" label="Phone"  value={formData.phone} />
                  <ReviewRow icon="🛡️" label="Role"   value={formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} />
                  <ReviewRow icon="🔑" label="Password" value={'•'.repeat(Math.min(formData.password.length, 12))} />
                </div>
              </div>

              {/* Password strength summary */}
              <div className="reg-review-pw">
                <span>Password strength:</span>
                <div className="auth-pw-bars" style={{ flex: 1 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="auth-pw-bar"
                      style={{ background: i <= pwStrength.score ? pwStrength.color : '#e2e8f0' }} />
                  ))}
                </div>
                <span style={{ color: pwStrength.color, fontWeight: 700, fontSize: 12 }}>{pwStrength.label}</span>
              </div>

              {/* Terms confirmation */}
              <div className="reg-review-terms">
                <span>✅</span>
                <span>Terms & Privacy Policy accepted</span>
              </div>

              <div className="reg-nav">
                <button type="button" className="reg-back-btn" onClick={prevStep}>← Back</button>
                <button type="button" className="auth-submit-btn reg-next-btn" onClick={handleSubmit} disabled={loading}>
                  {loading
                    ? <span className="auth-spinner-row"><span className="auth-btn-spinner" /> Creating…</span>
                    : '🚀 Create Account'}
                </button>
              </div>
            </div>
          )}

          <div className="auth-footer" style={{ marginTop: 16 }}>
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>

          <div className="auth-security-note">
            <span>🔒</span>
            <span>256-bit SSL encryption · HIPAA compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
