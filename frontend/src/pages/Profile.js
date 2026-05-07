import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import './Profile.css';

function EyeIcon({ open }) {
  return open
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}

const ROLE_ICON  = { patient: '👤', doctor: '👨⚕️', admin: '🛡️' };
const ROLE_COLOR = { patient: '#06b6d4', doctor: '#4f46e5', admin: '#7c3aed' };

export default function Profile({ onLogout }) {
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [saving,  setSaving]      = useState(false);
  const [success, setSuccess]     = useState('');
  const [error,   setError]       = useState('');
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', currentPassword: '', newPassword: '' });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/profile');
      setProfile(res.data);
      setForm(f => ({ ...f, name: res.data.name, phone: res.data.phone }));
    } catch (_) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone are required'); return;
    }
    setSaving(true);
    try {
      const res = await api.put('/profile', {
        name: form.name,
        phone: form.phone,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      });
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: res.data.user.name }));
      setProfile(p => ({ ...p, ...res.data.user }));
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
    setForm(f => ({ ...f, name: profile.name, phone: profile.phone, currentPassword: '', newPassword: '' }));
  };

  if (loading) return (
    <div className="dashboard">
      <Navbar onLogout={onLogout} />
      <div className="loading">Loading profile…</div>
    </div>
  );

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className="dashboard">
      <Navbar onLogout={onLogout} />

      <div className="dashboard-content">
        {/* Page header */}
        <div className="pf-page-header">
          <div>
            <h1 className="pf-page-title">My Profile</h1>
            <p className="pf-page-sub">Manage your personal information and account settings</p>
          </div>
          {!editing && (
            <button className="btn-primary" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
          )}
        </div>

        {success && <div className="success-message">{success}</div>}

        <div className="pf-layout">
          {/* ── LEFT: avatar card ── */}
          <div className="pf-sidebar">
            <div className="pf-avatar-card">
              <div className="pf-avatar" style={{ '--role-color': ROLE_COLOR[profile?.role] }}>
                {ROLE_ICON[profile?.role] || '👤'}
              </div>
              <h2 className="pf-name">{profile?.name}</h2>
              <span className="pf-role-badge" style={{ background: ROLE_COLOR[profile?.role] }}>
                {profile?.role}
              </span>
              <p className="pf-email">{profile?.email}</p>
              <p className="pf-joined">Member since {joinDate}</p>
            </div>

            {/* Stats */}
            <div className="pf-stats-card">
              <h3 className="pf-stats-title">Account Stats</h3>
              <div className="pf-stat-row">
                <div className="pf-stat-item" style={{ '--c': '#4f46e5' }}>
                  <div className="pf-stat-val">{profile?.stats?.appointments ?? 0}</div>
                  <div className="pf-stat-lbl">Appointments</div>
                </div>
                <div className="pf-stat-item" style={{ '--c': '#06b6d4' }}>
                  <div className="pf-stat-val">{profile?.stats?.records ?? 0}</div>
                  <div className="pf-stat-lbl">Records</div>
                </div>
              </div>
            </div>

            {/* Security info */}
            <div className="pf-info-card">
              <div className="pf-info-row">
                <span>🛡️ Role</span>
                <span className="pf-info-val" style={{ textTransform: 'capitalize' }}>{profile?.role}</span>
              </div>
              <div className="pf-info-row">
                <span>✅ Status</span>
                <span className="pf-info-badge">Active</span>
              </div>
              <div className="pf-info-row">
                <span>🔒 Password</span>
                <span className="pf-info-val">••••••••</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: details / edit form ── */}
          <div className="pf-main">
            {!editing ? (
              /* View mode */
              <div className="pf-panel">
                <div className="pf-panel-header">
                  <h2>Personal Information</h2>
                </div>
                <div className="pf-detail-grid">
                  <div className="pf-detail-item">
                    <div className="pf-detail-label">Full Name</div>
                    <div className="pf-detail-value">👤 {profile?.name}</div>
                  </div>
                  <div className="pf-detail-item">
                    <div className="pf-detail-label">Email Address</div>
                    <div className="pf-detail-value">✉️ {profile?.email}</div>
                  </div>
                  <div className="pf-detail-item">
                    <div className="pf-detail-label">Phone Number</div>
                    <div className="pf-detail-value">📞 {profile?.phone || '—'}</div>
                  </div>
                  <div className="pf-detail-item">
                    <div className="pf-detail-label">Role</div>
                    <div className="pf-detail-value">{ROLE_ICON[profile?.role]} {profile?.role}</div>
                  </div>
                  <div className="pf-detail-item">
                    <div className="pf-detail-label">Member Since</div>
                    <div className="pf-detail-value">📅 {joinDate}</div>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit mode */
              <div className="pf-panel">
                <div className="pf-panel-header">
                  <h2>Edit Profile</h2>
                  <span className="pf-panel-sub">Update your personal details below</span>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSave} className="pf-form">
                  <div className="pf-form-section">
                    <div className="pf-section-label">Personal Details</div>
                    <div className="pf-form-row">
                      <div className="pf-field">
                        <label>Full Name</label>
                        <div className="pf-input-wrap">
                          <span className="pf-input-icon">👤</span>
                          <input type="text" value={form.name} required
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Your full name" />
                        </div>
                      </div>
                      <div className="pf-field">
                        <label>Phone Number</label>
                        <div className="pf-input-wrap">
                          <span className="pf-input-icon">📞</span>
                          <input type="tel" value={form.phone} required
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="+1 (555) 000-0000" />
                        </div>
                      </div>
                    </div>
                    <div className="pf-field pf-field-readonly">
                      <label>Email Address <span className="pf-readonly-tag">Cannot be changed</span></label>
                      <div className="pf-input-wrap">
                        <span className="pf-input-icon">✉️</span>
                        <input type="email" value={profile?.email} disabled />
                      </div>
                    </div>
                  </div>

                  <div className="pf-form-section">
                    <div className="pf-section-label">Change Password <span className="pf-optional-tag">(optional)</span></div>
                    <div className="pf-form-row">
                      <div className="pf-field">
                        <label>Current Password</label>
                        <div className="pf-input-wrap">
                          <span className="pf-input-icon">🔑</span>
                          <input type={showCur ? 'text' : 'password'} value={form.currentPassword}
                            onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                            placeholder="Enter current password" />
                          <button type="button" className="pf-eye-btn" onClick={() => setShowCur(p => !p)}>
                            <EyeIcon open={showCur} />
                          </button>
                        </div>
                      </div>
                      <div className="pf-field">
                        <label>New Password</label>
                        <div className="pf-input-wrap">
                          <span className="pf-input-icon">🔒</span>
                          <input type={showNew ? 'text' : 'password'} value={form.newPassword}
                            onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                            placeholder="Min. 6 characters" />
                          <button type="button" className="pf-eye-btn" onClick={() => setShowNew(p => !p)}>
                            <EyeIcon open={showNew} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pf-form-actions">
                    <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? '💾 Saving…' : '💾 Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
