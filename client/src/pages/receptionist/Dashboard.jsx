import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export function ReceptionistDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard/receptionist').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: 400 }}><div className="spinner" /></div>;
  const { stats, todayAppointments } = data || {};

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 24 }}>Reception Desk</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Hello {user?.firstName} · {new Date().toDateString()}</p>
        </div>
        <a href="/receptionist/book" className="btn btn-primary">+ Book for Patient</a>
      </div>

      <div className="stats-grid">
        {[
          { label: "Today's Total", value: stats?.todayTotal || 0, icon: '📅', color: 'var(--primary)' },
          { label: 'Checked In', value: stats?.checkedIn || 0, icon: '✅', color: '#66BB6A' },
          { label: 'Pending', value: stats?.pending || 0, icon: '⏳', color: '#FFA726' },
          { label: 'Remaining', value: stats?.remaining || 0, icon: '🔄', color: 'var(--secondary)' },
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

      <div className="card">
        <h3 className="card-title">Today's Appointments</h3>
        {todayAppointments?.length === 0 ? (
          <div className="empty-state">No appointments today</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Check-In</th></tr></thead>
              <tbody>
                {todayAppointments?.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{a.slotStart}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.patient?.firstName} {a.patient?.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.patient?.phone}</div>
                    </td>
                    <td style={{ fontSize: 14 }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                    <td>
                      {a.checkedIn ? (
                        <span className="badge badge-confirmed">✓ Checked In</span>
                      ) : ['pending', 'confirmed'].includes(a.status) ? (
                        <CheckInBtn apptId={a._id} onDone={() => window.location.reload()} />
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckInBtn({ apptId, onDone }) {
  const [loading, setLoading] = useState(false);
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await api.put(`/appointments/${apptId}/checkin`);
      toast.success('Patient checked in');
      onDone();
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };
  return <button className="btn btn-sm btn-success" onClick={handleCheckIn} disabled={loading}>{loading ? '...' : 'Check In'}</button>;
}

export function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/appointments', { params });
      setAppointments(data.appointments);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [dateFilter, statusFilter]);

  const checkIn = async (id) => {
    try {
      await api.put(`/appointments/${id}/checkin`);
      toast.success('Patient checked in');
      fetch();
    } catch { toast.error('Failed'); }
  };

  const cancel = async (id) => {
    const reason = prompt('Cancellation reason:');
    if (!reason) return;
    try {
      await api.put(`/appointments/${id}/cancel`, { reason });
      toast.success('Cancelled');
      fetch();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <div><h2 style={{ fontSize: 22 }}>Appointments</h2><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage and check-in patients</p></div>
        <a href="/receptionist/book" className="btn btn-primary">+ New Booking</a>
      </div>
      <div className="card mb-24">
        <div style={{ display: 'flex', gap: 12 }}>
          <input className="form-control" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ maxWidth: 200 }} />
          <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Status</option>
            {['pending', 'confirmed', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="card">
        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Checked In</th><th>Actions</th></tr></thead>
              <tbody>
                {appointments.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No appointments</td></tr>
                  : appointments.map(a => (
                    <tr key={a._id}>
                      <td><div style={{ fontWeight: 600 }}>{a.patient?.firstName} {a.patient?.lastName}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.patient?.phone}</div></td>
                      <td style={{ fontSize: 14 }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</td>
                      <td style={{ fontSize: 13 }}>{new Date(a.date).toLocaleDateString()}</td>
                      <td style={{ fontSize: 13 }}>{a.slotStart}</td>
                      <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                      <td>{a.checkedIn ? <span className="badge badge-confirmed">✓ Yes</span> : <span className="badge badge-cancelled">No</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {!a.checkedIn && ['pending', 'confirmed'].includes(a.status) && <button className="btn btn-sm btn-success" onClick={() => checkIn(a._id)}>Check In</button>}
                          {!['cancelled', 'completed'].includes(a.status) && <button className="btn btn-sm btn-danger" onClick={() => cancel(a._id)}>Cancel</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReceptionistDashboard;
