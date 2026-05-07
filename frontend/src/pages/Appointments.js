import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Appointments.css';
import api from '../services/api';

const EMPTY_FORM = { date: '', reason: '', doctorId: '', doctor: '' };
const REASON_LIMIT = 500;

const STATUS_TABS = [
  { key: 'all',       label: 'All',       icon: '📋' },
  { key: 'pending',   label: 'Pending',   icon: '⏳' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'completed', label: 'Completed', icon: '🏁' },
  { key: 'cancelled', label: 'Cancelled', icon: '❌' },
];

function StatCard({ icon, label, value, color }) {
  return (
    <div className="ap-stat-card" style={{ '--accent': color }}>
      <div className="ap-stat-icon">{icon}</div>
      <div>
        <div className="ap-stat-value">{value}</div>
        <div className="ap-stat-label">{label}</div>
      </div>
    </div>
  );
}

function CountdownBadge({ dateStr }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  if (diff < 0)  return <span className="ap-countdown past">Past</span>;
  if (diff === 0) return <span className="ap-countdown today">Today</span>;
  if (diff === 1) return <span className="ap-countdown soon">Tomorrow</span>;
  if (diff <= 7)  return <span className="ap-countdown soon">In {diff} days</span>;
  return <span className="ap-countdown future">In {diff} days</span>;
}

function AppointmentCard({ apt, expanded, onToggle, view }) {
  const dateObj = new Date(apt.date);
  const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const dayStr   = dateObj.getDate();

  return (
    <div className={`ap-card ${expanded ? 'expanded' : ''} ${view}`}>
      {/* Calendar thumb (grid view) */}
      {view === 'grid' && (
        <div className="ap-cal-thumb">
          <span className="ap-cal-month">{monthStr}</span>
          <span className="ap-cal-day">{dayStr}</span>
        </div>
      )}

      {/* Header row */}
      <div className="ap-card-header" onClick={onToggle} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle()}>
        <div className="ap-card-header-left">
          {view === 'list' && (
            <div className="ap-list-date">
              <span className="ap-list-month">{monthStr}</span>
              <span className="ap-list-day">{dayStr}</span>
            </div>
          )}
          <div className="ap-card-info">
            <h3 className="ap-reason">{apt.reason}</h3>
            <div className="ap-card-meta">
              <span className="ap-meta-chip doctor">👨‍⚕️ {apt.doctor || 'Doctor TBD'}</span>
              <span className="ap-meta-chip patient">👤 {apt.patientName}</span>
            </div>
          </div>
        </div>
        <div className="ap-card-header-right">
          <span className={`status-badge ${apt.status}`}>{apt.status}</span>
          <CountdownBadge dateStr={apt.date} />
          <span className={`ap-expand-btn ${expanded ? 'open' : ''}`}>▾</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="ap-card-body">
          <div className="ap-detail-chips">
            <div className="ap-detail-chip">
              <span className="ap-chip-icon">📅</span>
              <div>
                <div className="ap-chip-label">Date</div>
                <div className="ap-chip-value">{dateStr}</div>
              </div>
            </div>
            <div className="ap-detail-chip">
              <span className="ap-chip-icon">👨‍⚕️</span>
              <div>
                <div className="ap-chip-label">Doctor</div>
                <div className="ap-chip-value">{apt.doctor || 'To be assigned'}</div>
              </div>
            </div>
            <div className="ap-detail-chip">
              <span className="ap-chip-icon">👤</span>
              <div>
                <div className="ap-chip-label">Patient</div>
                <div className="ap-chip-value">{apt.patientName}</div>
              </div>
            </div>
            <div className="ap-detail-chip">
              <span className="ap-chip-icon">🏷️</span>
              <div>
                <div className="ap-chip-label">Status</div>
                <div className="ap-chip-value" style={{ textTransform: 'capitalize' }}>{apt.status}</div>
              </div>
            </div>
          </div>

          <div className="ap-reason-section">
            <div className="ap-section-header">
              <span>📝</span>
              <span className="ap-section-title">Reason for Visit</span>
            </div>
            <p className="ap-reason-text">{apt.reason}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Appointments({ onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [view, setView] = useState('grid');
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const firstFieldRef = useRef(null);
  const navigate = useNavigate();

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoadingDoctors(true);
      const res = await api.get('/users?role=doctor');
      setDoctors(res.data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(userData);
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (showModal) {
      fetchDoctors();
      setTimeout(() => firstFieldRef.current?.focus(), 100);
    }
  }, [showModal, fetchDoctors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.date) return setError('Please select an appointment date');
    if (!formData.reason.trim()) return setError('Reason for appointment is required');
    const sel = new Date(formData.date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (sel < today) return setError('Appointment date cannot be in the past');

    setSubmitting(true);
    try {
      await api.post('/appointments', {
        date: formData.date,
        reason: formData.reason,
        doctorId: formData.doctorId || null,
        doctor: formData.doctor || null
      });
      setSuccess('Appointment booked successfully!');
      setShowModal(false);
      setFormData(EMPTY_FORM);
      setTimeout(() => setSuccess(''), 3000);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => { onLogout(); navigate('/login'); };

  // Derived stats
  const today = new Date().toDateString();
  const todayCount     = appointments.filter(a => new Date(a.date).toDateString() === today).length;
  const pendingCount   = appointments.filter(a => a.status === 'pending').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;

  // Tab counts
  const tabCount = (key) => key === 'all' ? appointments.length : appointments.filter(a => a.status === key).length;

  // Filtered list
  const filtered = appointments.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.reason?.toLowerCase().includes(q) || a.doctor?.toLowerCase().includes(q) || a.patientName?.toLowerCase().includes(q);
    const matchTab = activeTab === 'all' || a.status === activeTab;
    return matchSearch && matchTab;
  });

  if (loading) return <div className="loading">Loading appointments…</div>;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">🏥 MediCare HMS</div>
        <div className="navbar-menu">
          <button onClick={() => navigate('/dashboard')} className="nav-link">Dashboard</button>
          <button onClick={() => navigate('/appointments')} className="nav-link active">Appointments</button>
          <button onClick={() => navigate('/records')} className="nav-link">Medical Records</button>
          <button onClick={handleLogout} className="nav-link logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">

        {/* ── Page Header ── */}
        <div className="ap-page-header">
          <div>
            <h1 className="ap-page-title">Appointments</h1>
            <p className="ap-page-subtitle">Schedule, track and manage all patient appointments</p>
          </div>
          {user?.role === 'patient' && (
            <button onClick={() => setShowModal(true)} className="btn-primary ap-book-btn">
              + Book Appointment
            </button>
          )}
        </div>

        {success && <div className="success-message">{success}</div>}

        {/* ── Stats Bar ── */}
        <div className="ap-stats-bar">
          <StatCard icon="📋" label="Total"     value={appointments.length} color="#4f46e5" />
          <StatCard icon="📅" label="Today"     value={todayCount}          color="#06b6d4" />
          <StatCard icon="⏳" label="Pending"   value={pendingCount}        color="#f59e0b" />
          <StatCard icon="✅" label="Confirmed" value={confirmedCount}      color="#10b981" />
          <StatCard icon="🏁" label="Completed" value={completedCount}      color="#7c3aed" />
        </div>

        {/* ── Toolbar: search + view toggle ── */}
        <div className="ap-toolbar">
          <div className="ap-search-wrap">
            <span className="ap-search-icon">🔍</span>
            <input
              className="ap-search-input"
              type="text"
              placeholder="Search by reason, doctor, patient…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="ap-clear-btn" onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className="ap-view-toggle">
            <button className={`ap-view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')} title="Grid view">⊞</button>
            <button className={`ap-view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} title="List view">☰</button>
          </div>
        </div>

        {/* ── Status Filter Tabs ── */}
        <div className="ap-tabs">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              className={`ap-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="ap-tab-count">{tabCount(tab.key)}</span>
            </button>
          ))}
        </div>

        {/* ── Appointments ── */}
        {filtered.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-icon">📅</div>
            <h3>No appointments found</h3>
            <p>{search || activeTab !== 'all' ? 'Try adjusting your search or filter.' : 'Book your first appointment to get started.'}</p>
            {user?.role === 'patient' && !search && activeTab === 'all' && (
              <button onClick={() => setShowModal(true)} className="btn-primary" style={{ marginTop: 20 }}>
                + Book First Appointment
              </button>
            )}
          </div>
        ) : (
          <div className={`ap-list ${view}`}>
            {filtered.map(apt => (
              <AppointmentCard
                key={apt.id}
                apt={apt}
                view={view}
                expanded={expandedId === apt.id}
                onToggle={() => setExpandedId(expandedId === apt.id ? null : apt.id)}
              />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="ap-results-count">
            Showing {filtered.length} of {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Book Appointment Modal ── */}
      {showModal && user?.role === 'patient' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content ap-modal" onClick={e => e.stopPropagation()}>

            <div className="ap-modal-header">
              <div className="ap-modal-icon">📅</div>
              <div>
                <h2>Book Appointment</h2>
                <p>Fill in the details to schedule your visit</p>
              </div>
            </div>

            {error   && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit} className="ap-modal-form">
              <div className="form-group">
                <label>Appointment Date</label>
                <input
                  ref={firstFieldRef}
                  type="date"
                  value={formData.date}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  onChange={e => { setError(''); setFormData({ ...formData, date: e.target.value }); }}
                />
              </div>

              <div className="form-group">
                <label>
                  Reason for Visit
                  <span className="ap-char-count">({formData.reason.length}/{REASON_LIMIT})</span>
                </label>
                <textarea
                  value={formData.reason}
                  rows={3}
                  required
                  placeholder="e.g., Regular checkup, Consultation, Follow-up…"
                  maxLength={REASON_LIMIT}
                  onChange={e => {
                    setError('');
                    if (e.target.value.length <= REASON_LIMIT) setFormData({ ...formData, reason: e.target.value });
                  }}
                />
              </div>

              <div className="ap-doctor-row">
                <div className="form-group">
                  <label>Choose Doctor <span className="ap-optional">(optional)</span></label>
                  <select
                    value={formData.doctorId}
                    disabled={loadingDoctors}
                    onChange={e => { setError(''); setFormData({ ...formData, doctorId: e.target.value }); }}
                  >
                    <option value="">{loadingDoctors ? 'Loading…' : 'To be assigned'}</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Or Type Doctor Name <span className="ap-optional">(optional)</span></label>
                  <input
                    type="text"
                    value={formData.doctor}
                    placeholder="Custom doctor name"
                    onChange={e => { setError(''); setFormData({ ...formData, doctor: e.target.value }); }}
                  />
                </div>
              </div>

              {/* Preview strip */}
              {formData.date && (
                <div className="ap-preview-strip">
                  <span>📅 {new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  {(formData.doctorId || formData.doctor) && (
                    <span>👨‍⚕️ {doctors.find(d => d.id === Number(formData.doctorId))?.name || formData.doctor}</span>
                  )}
                </div>
              )}

              <div className="modal-buttons">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Booking…' : '📅 Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;
