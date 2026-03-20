import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Appointments.css';

function Appointments({ onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    reason: '',
    doctor: ''
  });
  const navigate = useNavigate();

  const fetchAppointments = useCallback(async () => {
    try {
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      // Filter appointments for current user if patient
      const userAppointments = currentUser?.role === 'patient' 
        ? allAppointments.filter(apt => apt.patientId === currentUser.id)
        : allAppointments;
        
      setAppointments(userAppointments);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      
      const newAppointment = {
        id: Date.now().toString(),
        patientId: currentUser.id,
        patientName: currentUser.name,
        date: formData.date,
        reason: formData.reason,
        doctor: formData.doctor || 'To be assigned',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      allAppointments.push(newAppointment);
      localStorage.setItem('appointments', JSON.stringify(allAppointments));
      
      setShowModal(false);
      setFormData({ date: '', reason: '', doctor: '' });
      fetchAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment');
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
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Book New Appointment
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="empty-state-box">
            <p>No appointments found</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Book Your First Appointment
            </button>
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

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Book New Appointment</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Reason for Visit</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    placeholder="e.g., Regular checkup, Consultation"
                  />
                </div>
                <div className="form-group">
                  <label>Doctor (Optional)</label>
                  <input
                    type="text"
                    value={formData.doctor}
                    onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                    placeholder="Enter doctor name (optional)"
                  />
                </div>
                <div className="modal-buttons">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Book Appointment
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
