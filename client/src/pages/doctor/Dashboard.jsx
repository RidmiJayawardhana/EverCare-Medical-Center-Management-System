import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function DoctorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard/doctor').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: 400 }}><div className="spinner" /></div>;

  const { stats, todayAppointments, profile, recentFeedback } = data || {};

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 24 }}>Good day, Dr. {user?.firstName}!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{profile?.specialization} · {new Date().toDateString()}</p>
        </div>
        <Link to="/doctor/appointments" className="btn btn-primary">View All Appointments</Link>
      </div>

      <div className="stats-grid">
        {[
          { label: "Today's Appointments", value: stats?.todayAppointments || 0, icon: '📅', bg: 'rgba(42,157,143,0.1)', color: 'var(--primary)' },
          { label: 'Total Patients', value: stats?.totalPatients || 0, icon: '👥', bg: 'rgba(82,181,224,0.1)', color: 'var(--secondary)' },
          { label: 'Pending', value: stats?.pendingAppointments || 0, icon: '⏳', bg: 'rgba(255,167,38,0.1)', color: '#FFA726' },
          { label: 'Completed', value: stats?.completedAppointments || 0, icon: '✅', bg: 'rgba(129,199,132,0.1)', color: '#66BB6A' },
          { label: 'Rating', value: `${stats?.rating || 0} ⭐`, icon: '⭐', bg: 'rgba(255,213,79,0.1)', color: '#F9A825' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
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
            <h3 className="card-title" style={{ marginBottom: 0 }}>Today's Schedule</h3>
            <Link to="/doctor/appointments" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>
          </div>
          {todayAppointments?.length === 0 ? (
            <div className="empty-state">No appointments today 🎉</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {todayAppointments?.map(a => (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-main)', borderRadius: 10 }}>
                  <div style={{ background: 'var(--primary)', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 700, minWidth: 52, textAlign: 'center' }}>{a.slotStart}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{a.patient?.firstName} {a.patient?.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.patient?.phone}</div>
                  </div>
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card mb-20">
            <h3 className="card-title">Profile Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
              <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Consultation Fee</span> <strong>LKR {profile?.consultationFee?.toLocaleString()}</strong></div>
              <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Experience</span> <strong>{profile?.experience} years</strong></div>
              <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Accepting</span>
                <span className={`badge ${profile?.isAcceptingAppointments ? 'badge-confirmed' : 'badge-cancelled'}`}>
                  {profile?.isAcceptingAppointments ? 'Yes' : 'No'}
                </span>
              </div>
              <Link to="/doctor/profile" className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>Update Profile</Link>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Recent Reviews</h3>
            {recentFeedback?.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No reviews yet</div>
            ) : recentFeedback?.map(f => (
              <div key={f._id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{f.patient?.firstName} {f.patient?.lastName}</span>
                  <span>{'⭐'.repeat(f.rating)}</span>
                </div>
                {f.comment && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{f.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
