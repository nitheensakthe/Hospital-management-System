import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import api from '../services/api';

function Dashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data.stats);
      setUpcomingAppointments(response.data.upcomingAppointments);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">Hospital Management System</div>
        <div className="navbar-menu">
          <button onClick={() => navigate('/dashboard')} className="nav-link active">Dashboard</button>
          <button onClick={() => navigate('/appointments')} className="nav-link">Appointments</button>
          <button onClick={() => navigate('/records')} className="nav-link">Medical Records</button>
          <button onClick={handleLogout} className="nav-link logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome, {user?.name}!</h1>
          <p className="user-role">Role: {user?.role}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{stats.totalAppointments}</h3>
              <p>Total Appointments</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>{stats.todayAppointments}</h3>
              <p>Today's Appointments</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <h3>{stats.pendingAppointments}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats.completedAppointments}</h3>
              <p>Completed</p>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <p className="empty-state">No upcoming appointments</p>
          ) : (
            <div className="appointments-list">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-date">
                    {new Date(apt.date).toLocaleDateString()}
                  </div>
                  <div className="appointment-details">
                    <h4>{apt.reason}</h4>
                    <p>{apt.doctor || 'Doctor TBD'}</p>
                    <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button onClick={() => navigate('/appointments')} className="action-btn">
              📅 View All Appointments
            </button>
            <button onClick={() => navigate('/records')} className="action-btn">
              📋 Medical Records
            </button>
            <button onClick={fetchDashboardData} className="action-btn">
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
