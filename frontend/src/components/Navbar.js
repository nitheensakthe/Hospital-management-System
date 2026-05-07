import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './Navbar.css';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_ICON  = { appointment: '📅', info: 'ℹ️', alert: '⚠️', success: '✅' };
const ROLE_ICON  = { patient: '👤', doctor: '👨‍⚕️', admin: '🛡️' };
const ROLE_COLOR = { patient: '#06b6d4', doctor: '#4f46e5', admin: '#7c3aed' };

export default function Navbar({ onLogout }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotif,    setShowNotif]      = useState(false);
  const [showUserMenu, setShowUserMenu]   = useState(false);
  const [user, setUser]                   = useState(null);
  const notifRef    = useRef(null);
  const userMenuRef = useRef(null);

  const unread = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(u);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current    && !notifRef.current.contains(e.target))    setShowNotif(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    } catch (_) {}
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
    } catch (_) {}
  };

  const handleLogout = () => { onLogout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
        🏥 <span>MediCare HMS</span>
      </div>

      <div className="navbar-links">
        <button onClick={() => navigate('/dashboard')}    className={`nav-link ${isActive('/dashboard')    ? 'active' : ''}`}>Dashboard</button>
        <button onClick={() => navigate('/appointments')} className={`nav-link ${isActive('/appointments') ? 'active' : ''}`}>Appointments</button>
        <button onClick={() => navigate('/records')}      className={`nav-link ${isActive('/records')      ? 'active' : ''}`}>Medical Records</button>
      </div>

      <div className="navbar-right">
        {/* Notifications */}
        <div className="nb-notif-wrap" ref={notifRef}>
          <button className="nb-icon-btn" onClick={() => { setShowNotif(v => !v); setShowUserMenu(false); }}>
            🔔
            {unread > 0 && <span className="nb-badge">{unread > 9 ? '9+' : unread}</span>}
          </button>

          {showNotif && (
            <div className="nb-dropdown nb-notif-dropdown">
              <div className="nb-dropdown-header">
                <span>Notifications {unread > 0 && <span className="nb-unread-count">{unread} new</span>}</span>
                {unread > 0 && <button className="nb-mark-all" onClick={markAllRead}>Mark all read</button>}
              </div>
              <div className="nb-notif-list">
                {notifications.length === 0 ? (
                  <div className="nb-empty"><span>🔔</span><p>No notifications yet</p></div>
                ) : notifications.map(n => (
                  <div key={n.id} className={`nb-notif-item ${!n.isRead ? 'unread' : ''}`}
                    onClick={() => markOneRead(n.id)}>
                    <div className="nb-notif-icon">{TYPE_ICON[n.type] || 'ℹ️'}</div>
                    <div className="nb-notif-body">
                      <div className="nb-notif-title">{n.title}</div>
                      <div className="nb-notif-msg">{n.message}</div>
                      <div className="nb-notif-time">{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.isRead && <div className="nb-notif-dot" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="nb-user-wrap" ref={userMenuRef}>
          <button className="nb-avatar-btn"
            style={{ '--role-color': ROLE_COLOR[user?.role] || '#4f46e5' }}
            onClick={() => { setShowUserMenu(v => !v); setShowNotif(false); }}>
            <span className="nb-avatar-icon">{ROLE_ICON[user?.role] || '👤'}</span>
            <span className="nb-avatar-name">{user?.name?.split(' ')[0]}</span>
            <span className="nb-avatar-caret">▾</span>
          </button>

          {showUserMenu && (
            <div className="nb-dropdown nb-user-dropdown">
              <div className="nb-user-header">
                <div className="nb-user-avatar-lg">{ROLE_ICON[user?.role] || '👤'}</div>
                <div>
                  <div className="nb-user-name">{user?.name}</div>
                  <div className="nb-user-email">{user?.email}</div>
                  <span className="nb-user-role" style={{ background: ROLE_COLOR[user?.role] }}>{user?.role}</span>
                </div>
              </div>
              <div className="nb-user-menu">
                <button onClick={() => { navigate('/profile');      setShowUserMenu(false); }} className="nb-menu-item"><span>👤</span> My Profile</button>
                <button onClick={() => { navigate('/appointments'); setShowUserMenu(false); }} className="nb-menu-item"><span>📅</span> Appointments</button>
                <button onClick={() => { navigate('/records');      setShowUserMenu(false); }} className="nb-menu-item"><span>📋</span> Medical Records</button>
                <div className="nb-menu-divider" />
                <button onClick={handleLogout} className="nb-menu-item nb-menu-logout"><span>🚪</span> Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
