import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MedicalRecords.css';
import api from '../services/api';

const CHARACTER_LIMITS = { diagnosis: 500, prescription: 500, notes: 1000 };

const EMPTY_FORM = { patientId: '', doctorId: '', diagnosis: '', prescription: '', notes: '', date: '' };

function StatCard({ icon, label, value, color }) {
  return (
    <div className="mr-stat-card" style={{ '--accent': color }}>
      <div className="mr-stat-icon">{icon}</div>
      <div>
        <div className="mr-stat-value">{value}</div>
        <div className="mr-stat-label">{label}</div>
      </div>
    </div>
  );
}

function InfoChip({ icon, label, value }) {
  return (
    <div className="mr-info-chip">
      <span className="mr-chip-icon">{icon}</span>
      <div>
        <div className="mr-chip-label">{label}</div>
        <div className="mr-chip-value">{value}</div>
      </div>
    </div>
  );
}

function RecordCard({ record, expanded, onToggle }) {
  const dateObj = new Date(record.date);
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className={`mr-record-card ${expanded ? 'expanded' : ''}`}>
      {/* Timeline dot */}
      <div className="mr-timeline-dot" />

      {/* Card header — always visible */}
      <div className="mr-card-header" onClick={onToggle} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onToggle()}>
        <div className="mr-card-header-left">
          <div className="mr-diagnosis-badge">🩺</div>
          <div>
            <h3 className="mr-diagnosis-title">{record.diagnosis}</h3>
            <div className="mr-card-meta">
              <span className="mr-meta-chip patient">👤 {record.patientName}</span>
              <span className="mr-meta-chip doctor">👨‍⚕️ {record.doctor || 'Unassigned'}</span>
            </div>
          </div>
        </div>
        <div className="mr-card-header-right">
          <span className="mr-date-badge">{dateStr}</span>
          <span className={`mr-expand-btn ${expanded ? 'open' : ''}`}>▾</span>
        </div>
      </div>

      {/* Expanded detail body */}
      {expanded && (
        <div className="mr-card-body">
          <div className="mr-chips-row">
            <InfoChip icon="📅" label="Record Date" value={dateStr} />
            <InfoChip icon="👤" label="Patient" value={record.patientName} />
            <InfoChip icon="👨‍⚕️" label="Attending Doctor" value={record.doctor || 'Not assigned'} />
          </div>

          <div className="mr-sections">
            <div className="mr-section diagnosis-section">
              <div className="mr-section-header">
                <span className="mr-section-icon">🩺</span>
                <span className="mr-section-title">Diagnosis</span>
              </div>
              <p className="mr-section-text">{record.diagnosis}</p>
            </div>

            <div className="mr-section prescription-section">
              <div className="mr-section-header">
                <span className="mr-section-icon">💊</span>
                <span className="mr-section-title">Prescription</span>
              </div>
              <p className="mr-section-text">{record.prescription}</p>
            </div>

            {record.notes && (
              <div className="mr-section notes-section">
                <div className="mr-section-header">
                  <span className="mr-section-icon">📝</span>
                  <span className="mr-section-title">Clinical Notes</span>
                </div>
                <p className="mr-section-text">{record.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MedicalRecords({ onLogout }) {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const firstFieldRef = useRef(null);
  const navigate = useNavigate();

  const fetchRecords = useCallback(async () => {
    try {
      const response = await api.get('/medical-records');
      setRecords(response.data);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsersForRecord = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const [pr, dr] = await Promise.all([api.get('/users?role=patient'), api.get('/users?role=doctor')]);
      setPatients(pr.data);
      setDoctors(dr.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(userData);
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (showModal && (user?.role === 'doctor' || user?.role === 'admin')) {
      fetchUsersForRecord();
      setTimeout(() => firstFieldRef.current?.focus(), 100);
    }
  }, [showModal, user?.role, fetchUsersForRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.patientId) return setError('Please select a patient');
    if (user?.role === 'admin' && !formData.doctorId) return setError('Please select a doctor');
    if (!formData.diagnosis.trim()) return setError('Diagnosis is required');
    if (!formData.prescription.trim()) return setError('Prescription is required');

    setSubmitting(true);
    try {
      await api.post('/medical-records', {
        patientId: formData.patientId,
        doctorId: user?.role === 'admin' ? formData.doctorId : undefined,
        diagnosis: formData.diagnosis,
        prescription: formData.prescription,
        notes: formData.notes,
        date: formData.date || undefined
      });
      setSuccess('Medical record saved successfully!');
      setShowModal(false);
      setFormData(EMPTY_FORM);
      setTimeout(() => setSuccess(''), 3000);
      fetchRecords();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create medical record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => { onLogout(); navigate('/login'); };

  // Derived stats
  const uniquePatients = new Set(records.map(r => r.patientName)).size;
  const uniqueDoctors  = new Set(records.map(r => r.doctor).filter(Boolean)).size;
  const thisMonth = records.filter(r => {
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Unique doctor names for filter dropdown
  const doctorNames = [...new Set(records.map(r => r.doctor).filter(Boolean))];

  // Filtered records
  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.diagnosis.toLowerCase().includes(q) || r.patientName?.toLowerCase().includes(q) || r.doctor?.toLowerCase().includes(q) || r.prescription?.toLowerCase().includes(q);
    const matchDoctor = !filterDoctor || r.doctor === filterDoctor;
    return matchSearch && matchDoctor;
  });

  if (loading) return <div className="loading">Loading medical records…</div>;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">🏥 MediCare HMS</div>
        <div className="navbar-menu">
          <button onClick={() => navigate('/dashboard')} className="nav-link">Dashboard</button>
          <button onClick={() => navigate('/appointments')} className="nav-link">Appointments</button>
          <button onClick={() => navigate('/records')} className="nav-link active">Medical Records</button>
          <button onClick={handleLogout} className="nav-link logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">

        {/* ── Page Header ── */}
        <div className="mr-page-header">
          <div>
            <h1 className="mr-page-title">Medical Records</h1>
            <p className="mr-page-subtitle">Complete patient health history & clinical documentation</p>
          </div>
          {(user?.role === 'doctor' || user?.role === 'admin') && (
            <button onClick={() => setShowModal(true)} className="btn-primary mr-add-btn">
              + Add Record
            </button>
          )}
        </div>

        {success && <div className="success-message">{success}</div>}

        {/* ── Stats Bar ── */}
        <div className="mr-stats-bar">
          <StatCard icon="📋" label="Total Records"    value={records.length} color="#4f46e5" />
          <StatCard icon="👤" label="Patients"         value={uniquePatients}  color="#06b6d4" />
          <StatCard icon="👨‍⚕️" label="Doctors"         value={uniqueDoctors}   color="#7c3aed" />
          <StatCard icon="📅" label="This Month"       value={thisMonth}       color="#10b981" />
        </div>

        {/* ── Search & Filter ── */}
        <div className="mr-toolbar">
          <div className="mr-search-wrap">
            <span className="mr-search-icon">🔍</span>
            <input
              className="mr-search-input"
              type="text"
              placeholder="Search by diagnosis, patient, doctor, prescription…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="mr-clear-btn" onClick={() => setSearch('')}>✕</button>}
          </div>
          <select
            className="mr-filter-select"
            value={filterDoctor}
            onChange={e => setFilterDoctor(e.target.value)}
          >
            <option value="">All Doctors</option>
            {doctorNames.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* ── Records ── */}
        {filtered.length === 0 ? (
          <div className="mr-empty">
            <div className="mr-empty-icon">🗂️</div>
            <h3>No records found</h3>
            <p>{search || filterDoctor ? 'Try adjusting your search or filter.' : 'Medical records will appear here after appointments.'}</p>
            {(user?.role === 'doctor' || user?.role === 'admin') && !search && !filterDoctor && (
              <button onClick={() => setShowModal(true)} className="btn-primary" style={{ marginTop: 20 }}>
                + Add First Record
              </button>
            )}
          </div>
        ) : (
          <div className="mr-timeline">
            <div className="mr-timeline-line" />
            {filtered.map(record => (
              <RecordCard
                key={record.id}
                record={record}
                expanded={expandedId === record.id}
                onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
              />
            ))}
          </div>
        )}

        {/* ── Results count ── */}
        {filtered.length > 0 && (
          <p className="mr-results-count">
            Showing {filtered.length} of {records.length} record{records.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Add Record Modal ── */}
      {showModal && (user?.role === 'doctor' || user?.role === 'admin') && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content mr-modal" onClick={e => e.stopPropagation()}>
            <div className="mr-modal-header">
              <div className="mr-modal-icon">📋</div>
              <div>
                <h2>Add Medical Record</h2>
                <p>Document patient diagnosis and treatment</p>
              </div>
            </div>

            {error   && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mr-form-row">
                <div className="form-group">
                  <label>Patient</label>
                  <select ref={firstFieldRef} value={formData.patientId}
                    onChange={e => { setError(''); setFormData({ ...formData, patientId: e.target.value }); }}
                    disabled={loadingUsers} required>
                    <option value="">{loadingUsers ? 'Loading…' : 'Select patient'}</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {user?.role === 'admin' && (
                  <div className="form-group">
                    <label>Doctor</label>
                    <select value={formData.doctorId}
                      onChange={e => { setError(''); setFormData({ ...formData, doctorId: e.target.value }); }}
                      disabled={loadingUsers} required>
                      <option value="">{loadingUsers ? 'Loading…' : 'Select doctor'}</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Diagnosis <span className="mr-char-count">({formData.diagnosis.length}/{CHARACTER_LIMITS.diagnosis})</span></label>
                <textarea value={formData.diagnosis} rows={3} required placeholder="Enter primary diagnosis…"
                  maxLength={CHARACTER_LIMITS.diagnosis}
                  onChange={e => { setError(''); if (e.target.value.length <= CHARACTER_LIMITS.diagnosis) setFormData({ ...formData, diagnosis: e.target.value }); }} />
              </div>

              <div className="form-group">
                <label>Prescription <span className="mr-char-count">({formData.prescription.length}/{CHARACTER_LIMITS.prescription})</span></label>
                <textarea value={formData.prescription} rows={3} required placeholder="Medications, dosage, frequency…"
                  maxLength={CHARACTER_LIMITS.prescription}
                  onChange={e => { setError(''); if (e.target.value.length <= CHARACTER_LIMITS.prescription) setFormData({ ...formData, prescription: e.target.value }); }} />
              </div>

              <div className="form-group">
                <label>Clinical Notes <span className="mr-char-count">({formData.notes.length}/{CHARACTER_LIMITS.notes})</span></label>
                <textarea value={formData.notes} rows={3} placeholder="Optional observations, follow-up instructions…"
                  maxLength={CHARACTER_LIMITS.notes}
                  onChange={e => { setError(''); if (e.target.value.length <= CHARACTER_LIMITS.notes) setFormData({ ...formData, notes: e.target.value }); }} />
              </div>

              <div className="form-group">
                <label>Record Date <span className="mr-optional">(optional)</span></label>
                <input type="date" value={formData.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => { setError(''); setFormData({ ...formData, date: e.target.value }); }} />
              </div>

              <div className="modal-buttons">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : '💾 Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalRecords;
