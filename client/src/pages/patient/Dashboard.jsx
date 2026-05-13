import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard/patient').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: 400 }}><div className="spinner" /></div>;

  const { stats, upcomingAppointments, pastAppointments } = data || {};

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 24 }}>Hello, {user?.firstName}! 👋</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage your health appointments and records</p>
        </div>
        <Link to="/patient/book" className="btn btn-primary">Book Appointment</Link>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Upcoming Appointments', value: stats?.upcomingCount || 0, icon: '📅', color: 'var(--primary)' },
          { label: 'Total Appointments', value: stats?.totalAppointments || 0, icon: '📋', color: 'var(--secondary)' },
          { label: 'Total Spent', value: `LKR ${(stats?.totalSpent || 0).toLocaleString()}`, icon: '💳', color: '#66BB6A' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--bg-main)', fontSize: 24 }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="flex-between mb-16">
            <h3 className="card-title" style={{ marginBottom: 0 }}>Upcoming Appointments</h3>
            <Link to="/patient/appointments" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>
          </div>
          {upcomingAppointments?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>No upcoming appointments</p>
              <Link to="/patient/book" className="btn btn-primary btn-sm">Book Now</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingAppointments?.map(a => (
                <div key={a._id} style={{ padding: '12px 14px', background: 'var(--bg-main)', borderRadius: 10, borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontWeight: 600 }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(a.date).toDateString()} at {a.slotStart}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                    <span className={`badge badge-${a.paymentStatus}`}>{a.paymentStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex-between mb-16">
            <h3 className="card-title" style={{ marginBottom: 0 }}>Past Appointments</h3>
          </div>
          {pastAppointments?.length === 0 ? (
            <div className="empty-state">No past appointments</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pastAppointments?.map(a => (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(a.date).toDateString()}</div>
                  </div>
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">Quick Actions</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/patient/doctors" className="btn btn-outline">🔍 Find a Doctor</Link>
          <Link to="/patient/book" className="btn btn-primary">📅 Book Appointment</Link>
          <Link to="/patient/appointments" className="btn btn-secondary">📋 My Appointments</Link>
        </div>
      </div>
    </div>
  );
}
