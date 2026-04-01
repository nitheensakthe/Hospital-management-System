import React, { useState, useEffect, useCallback } from 'react';
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
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    diagnosis: '',
    prescription: '',
    notes: '',
    date: ''
  });
  const navigate = useNavigate();

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
      const [patientResponse, doctorResponse] = await Promise.all([
        api.get('/users?role=patient'),
        api.get('/users?role=doctor')
      ]);
      setPatients(patientResponse.data);
      setDoctors(doctorResponse.data);
    } catch (fetchError) {
      console.error('Error fetching users for records:', fetchError);
    }
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(userData);
    fetchRecords();
    if (userData?.role === 'doctor' || userData?.role === 'admin') {
      fetchUsersForRecord();
    }
  }, [fetchRecords, fetchUsersForRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/medical-records', {
        patientId: formData.patientId,
        doctorId: user?.role === 'admin' ? formData.doctorId : undefined,
        diagnosis: formData.diagnosis,
        prescription: formData.prescription,
        notes: formData.notes,
        date: formData.date || undefined
      });
      setShowModal(false);
      setFormData({
        patientId: '',
        doctorId: '',
        diagnosis: '',
        prescription: '',
        notes: '',
        date: ''
      });
      fetchRecords();
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to create medical record');
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
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Patient</label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    required
                  >
                    <option value="">Select patient</option>
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
                      onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                      required
                    >
                      <option value="">Select doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Diagnosis</label>
                  <input
                    type="text"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Prescription</label>
                  <input
                    type="text"
                    value={formData.prescription}
                    onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="modal-buttons">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Record
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
