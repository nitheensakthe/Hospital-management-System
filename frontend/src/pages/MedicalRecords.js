import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './MedicalRecords.css';

function MedicalRecords({ onLogout }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRecords = useCallback(async () => {
    try {
      const allRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      // Filter records for current user if patient
      const userRecords = currentUser?.role === 'patient' 
        ? allRecords.filter(rec => rec.patientId === currentUser.id)
        : allRecords;
        
      setRecords(userRecords);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching records:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

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
      </div>
    </div>
  );
}

export default MedicalRecords;
