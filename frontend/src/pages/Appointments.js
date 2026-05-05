import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Appointments.css';
import api from '../services/api';

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
  const firstFieldRef = useRef(null);
  const [formData, setFormData] = useState({
    date: '',
    reason: '',
    doctorId: '',
    doctor: ''
  });
  const navigate = useNavigate();

  const CHARACTER_LIMITS = {
    reason: 500
  };

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoadingDoctors(true);
      const response = await api.get('/users?role=doctor');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(userData);
    fetchAppointments();
  }, [fetchAppointments]);

  // Fetch doctors when modal opens
  useEffect(() => {
    if (showModal) {
      fetchDoctors();
      // Auto-focus to first field after modal opens
      setTimeout(() => {
        if (firstFieldRef.current) {
          firstFieldRef.current.focus();
        }
      }, 100);
    }
  }, [showModal, fetchDoctors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation before submit
    if (!formData.date) {
      setError('Please select an appointment date');
      return;
    }
    if (!formData.reason.trim()) {
      setError('Reason for appointment is required');
      return;
    }

    // Check if date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('Appointment date cannot be in the past');
      return;
    }

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
      setFormData({ date: '', reason: '', doctorId: '', doctor: '' });
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">Hospital Management System</div>
        <div className="navbar-menu">
          <button onClick={() => navigate('/dashboard')} className="nav-link">Dashboard</button>
          <button onClick={() => navigate('/appointments')} className="nav-link active">Appointments</button>
          <button onClick={() => navigate('/records')} className="nav-link">Medical Records</button>
          <button onClick={handleLogout} className="nav-link logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="page-header">
          <h1>Appointments</h1>
          {user?.role === 'patient' && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              + Book New Appointment
            </button>
          )}
        </div>

        {appointments.length === 0 ? (
          <div className="empty-state-box">
            <p>No appointments found</p>
            <p style={{ fontSize: '14px', color: '#999' }}>Book your first appointment to get started</p>
            {user?.role === 'patient' && (
              <button onClick={() => setShowModal(true)} className="btn-primary">
                Book Your First Appointment
              </button>
            )}
          </div>
        ) : (
          <div className="appointments-grid">
            {appointments.map((apt) => (
              <div key={apt.id} className="appointment-item">
                <div className="appointment-header">
                  <h3>{apt.reason}</h3>
                  <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                </div>
                <div className="appointment-info">
                  <p><strong>Date:</strong> {new Date(apt.date).toLocaleDateString()}</p>
                  <p><strong>Doctor:</strong> {apt.doctor || 'Not assigned'}</p>
                  <p><strong>Patient:</strong> {apt.patientName}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && user?.role === 'patient' && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Book New Appointment</h2>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    ref={firstFieldRef}
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setError('');
                      setFormData({ ...formData, date: e.target.value });
                    }}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Reason for Visit ({formData.reason.length}/{CHARACTER_LIMITS.reason})</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => {
                      setError('');
                      if (e.target.value.length <= CHARACTER_LIMITS.reason) {
                        setFormData({ ...formData, reason: e.target.value });
                      }
                    }}
                    required
                    placeholder="e.g., Regular checkup, Consultation, Follow-up"
                    maxLength={CHARACTER_LIMITS.reason}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Choose Doctor (Optional)</label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => {
                      setError('');
                      setFormData({ ...formData, doctorId: e.target.value });
                    }}
                    disabled={loadingDoctors}
                  >
                    <option value="">{loadingDoctors ? 'Loading doctors...' : 'To be assigned'}</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Or type Doctor Name</label>
                  <input
                    type="text"
                    value={formData.doctor}
                    onChange={(e) => {
                      setError('');
                      setFormData({ ...formData, doctor: e.target.value });
                    }}
                    placeholder="Custom doctor name (optional)"
                  />
                </div>
                <div className="modal-buttons">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Booking...' : 'Book Appointment'}
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

export default Appointments;
