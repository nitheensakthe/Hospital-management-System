import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MedicalRecords.css';
import api from '../services/api';

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
  const firstFieldRef = useRef(null);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    diagnosis: '',
    prescription: '',
    notes: '',
    date: ''
  });
  const navigate = useNavigate();

  const CHARACTER_LIMITS = {
    diagnosis: 500,
    prescription: 500,
    notes: 1000
  };

  const fetchRecords = useCallback(async () => {
    try {
      const response = await api.get('/medical-records');
      setRecords(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching records:', error);
      setLoading(false);
    }
  }, []);

  const fetchUsersForRecord = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const [patientResponse, doctorResponse] = await Promise.all([
        api.get('/users?role=patient'),
        api.get('/users?role=doctor')
      ]);
      setPatients(patientResponse.data);
      setDoctors(doctorResponse.data);
    } catch (fetchError) {
      console.error('Error fetching users for records:', fetchError);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(userData);
    fetchRecords();
  }, [fetchRecords]);

  // Fetch patients and doctors when modal opens
  useEffect(() => {
    if (showModal && (user?.role === 'doctor' || user?.role === 'admin')) {
      fetchUsersForRecord();
      // Auto-focus to first field after modal opens
      setTimeout(() => {
        if (firstFieldRef.current) {
          firstFieldRef.current.focus();
        }
      }, 100);
    }
  }, [showModal, user?.role, fetchUsersForRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation before submit
    if (!formData.patientId) {
      setError('Please select a patient');
      return;
    }
    if (user?.role === 'admin' && !formData.doctorId) {
      setError('Please select a doctor');
      return;
    }
    if (!formData.diagnosis.trim()) {
      setError('Diagnosis is required');
      return;
    }
    if (!formData.prescription.trim()) {
      setError('Prescription is required');
      return;
    }

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
      setFormData({
        patientId: '',
        doctorId: '',
        diagnosis: '',
        prescription: '',
        notes: '',
        date: ''
      });
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      fetchRecords();
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to create medical record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading medical records...</div>;
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">Hospital Management System</div>
        <div className="navbar-menu">
          <button onClick={() => navigate('/dashboard')} className="nav-link">Dashboard</button>
          <button onClick={() => navigate('/appointments')} className="nav-link">Appointments</button>
          <button onClick={() => navigate('/records')} className="nav-link active">Medical Records</button>
          <button onClick={handleLogout} className="nav-link logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="page-header">
          <h1>Medical Records</h1>
          {(user?.role === 'doctor' || user?.role === 'admin') && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              + Add Medical Record
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div className="empty-state-box">
            <p>No medical records found</p>
            <p style={{ fontSize: '14px', color: '#999' }}>Medical records will appear here after appointments</p>
            {(user?.role === 'doctor' || user?.role === 'admin') && (
              <button onClick={() => setShowModal(true)} className="btn-primary" style={{ marginTop: '16px' }}>
                + Add Medical Record
              </button>
            )}
          </div>
        ) : (
          <div className="records-list">
            {records.map((record) => (
              <div key={record.id} className="record-item">
                <div className="record-header">
                  <h3>{record.diagnosis}</h3>
                  <span className="record-date">
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="record-body">
                  <p><strong>Patient:</strong> {record.patientName}</p>
                  <p><strong>Doctor:</strong> {record.doctor}</p>
                  <p><strong>Prescription:</strong> {record.prescription}</p>
                  <p><strong>Notes:</strong> {record.notes || 'No additional notes'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (user?.role === 'doctor' || user?.role === 'admin') && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add Medical Record</h2>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Patient</label>
                  <select
                    ref={firstFieldRef}
                    value={formData.patientId}
                    onChange={(e) => {
                      setError('');
                      setFormData({ ...formData, patientId: e.target.value });
                    }}
                    disabled={loadingUsers}
                    required
                  >
                    <option value="">{loadingUsers ? 'Loading patients...' : 'Select patient'}</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>{patient.name}</option>
                    ))}
                  </select>
                </div>

                {user?.role === 'admin' && (
                  <div className="form-group">
                    <label>Doctor</label>
                    <select
                      value={formData.doctorId}
                      onChange={(e) => {
                        setError('');
                        setFormData({ ...formData, doctorId: e.target.value });
                      }}
                      disabled={loadingUsers}
                      required
                    >
                      <option value="">{loadingUsers ? 'Loading doctors...' : 'Select doctor'}</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Diagnosis ({formData.diagnosis.length}/{CHARACTER_LIMITS.diagnosis})</label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={(e) => {
                      setError('');
                      if (e.target.value.length <= CHARACTER_LIMITS.diagnosis) {
                        setFormData({ ...formData, diagnosis: e.target.value });
                      }
                    }}
                    placeholder="Enter diagnosis"
                    maxLength={CHARACTER_LIMITS.diagnosis}
                    required
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Prescription ({formData.prescription.length}/{CHARACTER_LIMITS.prescription})</label>
                  <textarea
                    value={formData.prescription}
                    onChange={(e) => {
                      setError('');
                      if (e.target.value.length <= CHARACTER_LIMITS.prescription) {
                        setFormData({ ...formData, prescription: e.target.value });
                      }
                    }}
                    placeholder="Enter prescription"
                    maxLength={CHARACTER_LIMITS.prescription}
                    required
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Notes ({formData.notes.length}/{CHARACTER_LIMITS.notes})</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => {
                      setError('');
                      if (e.target.value.length <= CHARACTER_LIMITS.notes) {
                        setFormData({ ...formData, notes: e.target.value });
                      }
                    }}
                    placeholder="Optional notes"
                    maxLength={CHARACTER_LIMITS.notes}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setError('');
                      setFormData({ ...formData, date: e.target.value });
                    }}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="modal-buttons">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MedicalRecords;
