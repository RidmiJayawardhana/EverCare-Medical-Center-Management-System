import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const { data } = await api.get('/appointments', { params });
      setAppointments(data.appointments);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, [statusFilter, dateFilter]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch { toast.error('Failed to update'); }
  };

  const cancelAppt = async (id) => {
    const reason = prompt('Cancellation reason:');
    if (!reason) return;
    try {
      await api.put(`/appointments/${id}/cancel`, { reason });
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 22 }}>All Appointments</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>System-wide appointment management</p>
        </div>
      </div>

      <div className="card mb-24">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Statuses</option>
            {['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="form-control" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ maxWidth: 200 }} />
          <button className="btn btn-secondary" onClick={() => { setStatusFilter(''); setDateFilter(''); }}>Clear</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No appointments found</td></tr>
                ) : appointments.map(a => (
                  <tr key={a._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.patient?.firstName} {a.patient?.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.patient?.phone}</div>
                    </td>
                    <td style={{ fontSize: 14 }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</td>
                    <td style={{ fontSize: 13 }}>{new Date(a.date).toLocaleDateString()}</td>
                    <td style={{ fontSize: 13 }}>{a.slotStart} – {a.slotEnd}</td>
                    <td style={{ fontSize: 13 }}>LKR {a.consultationFee?.toLocaleString()}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                    <td><span className={`badge badge-${a.paymentStatus}`}>{a.paymentStatus}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {a.status === 'pending' && (
                          <button className="btn btn-sm btn-success" onClick={() => updateStatus(a._id, 'confirmed')} style={{ fontSize: 11 }}>Confirm</button>
                        )}
                        {a.status === 'confirmed' && (
                          <button className="btn btn-sm btn-primary" onClick={() => updateStatus(a._id, 'completed')} style={{ fontSize: 11 }}>Complete</button>
                        )}
                        {!['cancelled', 'completed'].includes(a.status) && (
                          <button className="btn btn-sm btn-danger" onClick={() => cancelAppt(a._id)} style={{ fontSize: 11 }}>Cancel</button>
                        )}
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
