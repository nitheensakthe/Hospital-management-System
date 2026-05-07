import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import api from '../services/api';

/* ── Live Clock ── */
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="db-clock">
      <span className="db-clock-time">
        {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="db-clock-date">
        {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </span>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="db-stat-card" style={{ '--accent': color }}>
      <div className="db-stat-icon">{icon}</div>
      <div className="db-stat-body">
        <div className="db-stat-value">{value}</div>
        <div className="db-stat-label">{label}</div>
        {sub && <div className="db-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

/* ── Progress Bar ── */
function ProgressBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="db-progress-row">
      <div className="db-progress-meta">
        <span className="db-progress-label">{label}</span>
        <span className="db-progress-pct">{pct}%</span>
      </div>
      <div className="db-progress-track">
        <div className="db-progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="db-progress-counts">{value} / {max}</div>
    </div>
  );
}

/* ── Activity Item ── */
function ActivityItem({ icon, text, time, color }) {
  return (
    <div className="db-activity-item">
      <div className="db-activity-dot" style={{ background: color }}>{icon}</div>
      <div className="db-activity-body">
        <p className="db-activity-text">{text}</p>
        <span className="db-activity-time">{time}</span>
      </div>
    </div>
  );
}

/* ── Next Appointment Card ── */
function NextAppointmentCard({ apt, onNavigate }) {
  if (!apt) return null;
  const dateObj = new Date(apt.date);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((dateObj - today) / 86400000);
  const countdown = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`;

  return (
    <div className="db-next-apt">
      <div className="db-next-apt-header">
        <span className="db-next-apt-label">⚡ Next Appointment</span>
        <span className="db-next-countdown">{countdown}</span>
      </div>
      <div className="db-next-apt-body">
        <div className="db-next-cal">
          <span className="db-next-month">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
          <span className="db-next-day">{dateObj.getDate()}</span>
          <span className="db-next-year">{dateObj.getFullYear()}</span>
        </div>
        <div className="db-next-info">
          <h3>{apt.reason}</h3>
          <p>👨‍⚕️ {apt.doctor || 'Doctor TBD'}</p>
          <span className={`status-badge ${apt.status}`}>{apt.status}</span>
        </div>
      </div>
      <button className="db-next-btn" onClick={onNavigate}>View All Appointments →</button>
    </div>
  );
}

/* ── Quick Action Card ── */
function ActionCard({ icon, title, desc, color, onClick }) {
  return (
    <div className="db-action-card" style={{ '--accent': color }} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="db-action-icon">{icon}</div>
      <div>
        <div className="db-action-title">{title}</div>
        <div className="db-action-desc">{desc}</div>
      </div>
      <span className="db-action-arrow">→</span>
    </div>
  );
}

/* ══════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════ */
function Dashboard({ onLogout }) {
  const [user, setUser]   = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0, todayAppointments: 0,
    pendingAppointments: 0, completedAppointments: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await api.get('/dashboard');
      setStats(res.data.stats);
      setUpcomingAppointments(res.data.upcomingAppointments);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => { onLogout(); navigate('/login'); };

  if (loading) return <div className="loading">Loading dashboard…</div>;

  /* Derived */
  const confirmedCount = upcomingAppointments.filter(a => a.status === 'confirmed').length;
  const nextApt = upcomingAppointments.find(a => a.status !== 'cancelled');
  const completionRate = stats.totalAppointments > 0
    ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100) : 0;

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  /* Activity feed — derived from upcoming appointments */
  const activityFeed = upcomingAppointments.slice(0, 5).map((apt, i) => ({
    icon: apt.status === 'completed' ? '✅' : apt.status === 'confirmed' ? '📋' : apt.status === 'cancelled' ? '❌' : '⏳',
    text: `Appointment: "${apt.reason}" with ${apt.doctor || 'Doctor TBD'}`,
    time: new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    color: apt.status === 'completed' ? '#10b981' : apt.status === 'confirmed' ? '#4f46e5' : apt.status === 'cancelled' ? '#ef4444' : '#f59e0b',
    id: apt.id || i
  }));

  const roleIcon = { patient: '👤', doctor: '👨‍⚕️', admin: '🛡️' };

  return (
    <div className="dashboard">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">🏥 MediCare HMS</div>
        <div className="navbar-menu">
          <button onClick={() => navigate('/dashboard')}    className="nav-link active">Dashboard</button>
          <button onClick={() => navigate('/appointments')} className="nav-link">Appointments</button>
          <button onClick={() => navigate('/records')}      className="nav-link">Medical Records</button>
          <button onClick={handleLogout}                    className="nav-link logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">

        {/* ── Hero Banner ── */}
        <div className="db-hero">
          <div className="db-hero-left">
            <div className="db-hero-avatar">{roleIcon[user?.role] || '👤'}</div>
            <div>
              <p className="db-hero-greeting">{greeting},</p>
              <h1 className="db-hero-name">{user?.name}!</h1>
              <span className="db-hero-role">{user?.role}</span>
            </div>
          </div>
          <div className="db-hero-right">
            <LiveClock />
            <div className="db-hero-refresh">
              <span className="db-refresh-label">Last updated: {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              <button className="db-refresh-btn" onClick={fetchDashboardData} title="Refresh">↻ Refresh</button>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="stats-grid">
          <StatCard icon="📊" label="Total Appointments" value={stats.totalAppointments} color="#4f46e5" sub="All time" />
          <StatCard icon="📅" label="Today"              value={stats.todayAppointments} color="#06b6d4" sub={new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})} />
          <StatCard icon="⏳" label="Pending"            value={stats.pendingAppointments} color="#f59e0b" sub="Awaiting confirmation" />
          <StatCard icon="✅" label="Completed"          value={stats.completedAppointments} color="#10b981" sub={`${completionRate}% completion rate`} />
        </div>

        {/* ── 2-Column Layout ── */}
        <div className="db-two-col">

          {/* ── LEFT: main content ── */}
          <div className="db-main">

            {/* Health Summary */}
            <div className="db-panel">
              <div className="db-panel-header">
                <h2>📈 Appointment Summary</h2>
                <span className="db-panel-sub">Overview of all appointment statuses</span>
              </div>
              <div className="db-progress-list">
                <ProgressBar label="Completed"  value={stats.completedAppointments}  max={stats.totalAppointments} color="#10b981" />
                <ProgressBar label="Pending"    value={stats.pendingAppointments}    max={stats.totalAppointments} color="#f59e0b" />
                <ProgressBar label="Confirmed"  value={confirmedCount}               max={stats.totalAppointments} color="#4f46e5" />
                <ProgressBar label="Today"      value={stats.todayAppointments}      max={stats.totalAppointments} color="#06b6d4" />
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="db-panel">
              <div className="db-panel-header">
                <h2>📅 Upcoming Appointments</h2>
                <button className="db-panel-link" onClick={() => navigate('/appointments')}>View all →</button>
              </div>
              {upcomingAppointments.length === 0 ? (
                <div className="db-empty">
                  <span className="db-empty-icon">📭</span>
                  <p>No upcoming appointments</p>
                  <span>Your scheduled appointments will appear here</span>
                </div>
              ) : (
                <div className="appointments-list">
                  {upcomingAppointments.slice(0, 5).map(apt => {
                    const d = new Date(apt.date);
                    return (
                      <div key={apt.id} className="appointment-card">
                        <div className="db-apt-cal">
                          <span>{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <strong>{d.getDate()}</strong>
                        </div>
                        <div className="appointment-details">
                          <h4>{apt.reason}</h4>
                          <p>👨‍⚕️ {apt.doctor || 'Doctor TBD'}</p>
                          <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT: sidebar ── */}
          <div className="db-sidebar">

            {/* Next Appointment Highlight */}
            <NextAppointmentCard apt={nextApt} onNavigate={() => navigate('/appointments')} />

            {/* Quick Actions */}
            <div className="db-panel">
              <div className="db-panel-header">
                <h2>⚡ Quick Actions</h2>
              </div>
              <div className="db-actions-list">
                <ActionCard
                  icon="📅" title="Appointments"
                  desc="View & manage all appointments"
                  color="#4f46e5"
                  onClick={() => navigate('/appointments')}
                />
                <ActionCard
                  icon="📋" title="Medical Records"
                  desc="Access patient health records"
                  color="#06b6d4"
                  onClick={() => navigate('/records')}
                />
                <ActionCard
                  icon="↻" title="Refresh Data"
                  desc="Sync latest information"
                  color="#10b981"
                  onClick={fetchDashboardData}
                />
              </div>
            </div>

            {/* Activity Feed */}
            <div className="db-panel">
              <div className="db-panel-header">
                <h2>🕐 Recent Activity</h2>
                <span className="db-panel-sub">Latest appointment events</span>
              </div>
              {activityFeed.length === 0 ? (
                <div className="db-empty">
                  <span className="db-empty-icon">📭</span>
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="db-activity-feed">
                  {activityFeed.map(item => (
                    <ActivityItem key={item.id} icon={item.icon} text={item.text} time={item.time} color={item.color} />
                  ))}
                </div>
              )}
            </div>

            {/* System Info */}
            <div className="db-system-card">
              <div className="db-system-row">
                <span>🏥 System</span>
                <span className="db-system-badge online">● Online</span>
              </div>
              <div className="db-system-row">
                <span>👤 Logged in as</span>
                <span className="db-system-val">{user?.email}</span>
              </div>
              <div className="db-system-row">
                <span>🛡️ Role</span>
                <span className="db-system-val" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
              </div>
              <div className="db-system-row">
                <span>🔄 Last sync</span>
                <span className="db-system-val">{lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
