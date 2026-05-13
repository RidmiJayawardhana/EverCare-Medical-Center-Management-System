import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: 400 }}><div className="spinner" /></div>;

  const { stats, recentAppointments, recentUsers } = data || {};

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', bg: 'rgba(108,99,255,0.1)', color: '#6C63FF' },
    { label: 'Doctors', value: stats?.totalDoctors || 0, icon: '🩺', bg: 'rgba(42,157,143,0.1)', color: 'var(--primary)' },
    { label: 'Patients', value: stats?.totalPatients || 0, icon: '🧑‍⚕️', bg: 'rgba(82,181,224,0.1)', color: 'var(--secondary)' },
    { label: 'Appointments', value: stats?.totalAppointments || 0, icon: '📅', bg: 'rgba(244,162,97,0.1)', color: '#F4A261' },
    { label: 'Pending', value: stats?.pendingAppointments || 0, icon: '⏳', bg: 'rgba(255,167,38,0.1)', color: '#FFA726' },
    { label: 'Total Revenue', value: `LKR ${(stats?.totalRevenue || 0).toLocaleString()}`, icon: '💰', bg: 'rgba(129,199,132,0.1)', color: '#66BB6A' },
  ];

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 4 }}>Admin Overview</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>EverCare Medical Center — System-wide statistics</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/admin/users" className="btn btn-outline btn-sm">Manage Users</Link>
          <Link to="/admin/doctors" className="btn btn-primary btn-sm">Add Doctor</Link>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <span>{s.icon}</span>
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="flex-between mb-16">
            <h3 className="card-title" style={{ marginBottom: 0 }}>Recent Appointments</h3>
            <Link to="/admin/appointments" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>
          </div>
          {recentAppointments?.length === 0 ? (
            <div className="empty-state">No appointments yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentAppointments?.map(a => (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{a.patient?.firstName} {a.patient?.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</div>
                  </div>
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex-between mb-16">
            <h3 className="card-title" style={{ marginBottom: 0 }}>New Users</h3>
            <Link to="/admin/users" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>
          </div>
          {recentUsers?.length === 0 ? (
            <div className="empty-state">No users yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentUsers?.map(u => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.firstName} {u.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <span className={`badge badge-${u.role}`}>{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Quick Actions</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { to: '/admin/users', label: '➕ Add Staff User', color: '#6C63FF' },
            { to: '/admin/doctors', label: '🩺 Add Doctor', color: 'var(--primary)' },
            { to: '/admin/appointments', label: '📅 View All Appointments', color: 'var(--secondary)' },
            { to: '/admin/feedback', label: '⭐ Manage Feedback', color: '#F4A261' },
          ].map(q => (
            <Link key={q.to} to={q.to} style={{ padding: '12px 20px', borderRadius: 10, border: `1.5px solid ${q.color}`, color: q.color, fontWeight: 600, fontSize: 14, transition: 'all 0.2s' }}>
              {q.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
