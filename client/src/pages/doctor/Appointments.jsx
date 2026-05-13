import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [notesModal, setNotesModal] = useState(null);
  const [notes, setNotes] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const { data } = await api.get('/appointments', { params });
      setAppointments(data.appointments);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [statusFilter, dateFilter]);

  const updateStatus = async (id, status, notesText) => {
    try {
      await api.put(`/appointments/${id}/status`, { status, notes: notesText });
      toast.success(`Appointment marked as ${status}`);
      setNotesModal(null);
      fetch();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 22 }}>My Appointments</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage your patient appointments</p>
        </div>
      </div>

      <div className="card mb-24">
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Statuses</option>
            {['pending', 'confirmed', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="form-control" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ maxWidth: 200 }} />
        </div>
      </div>

      <div className="card">
        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Patient</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No appointments found</td></tr>
                ) : appointments.map(a => (
                  <tr key={a._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.patient?.firstName} {a.patient?.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.patient?.phone}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{new Date(a.date).toLocaleDateString()}</td>
                    <td style={{ fontSize: 13 }}>{a.slotStart} – {a.slotEnd}</td>
                    <td style={{ fontSize: 13, maxWidth: 160 }}>{a.reason || '—'}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {a.status === 'pending' && (
                          <button className="btn btn-sm btn-success" onClick={() => updateStatus(a._id, 'confirmed')}>Confirm</button>
                        )}
                        {a.status === 'confirmed' && (
                          <button className="btn btn-sm btn-primary" onClick={() => { setNotesModal(a); setNotes(''); }}>Complete</button>
                        )}
                        {a.status === 'confirmed' && (
                          <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(a._id, 'no_show')}>No Show</button>
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

      {notesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 480, width: '100%' }}>
            <h3 style={{ marginBottom: 16 }}>Complete Appointment</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              Patient: {notesModal.patient?.firstName} {notesModal.patient?.lastName}
            </p>
            <div className="form-group">
              <label className="form-label">Clinical Notes (optional)</label>
              <textarea className="form-control" rows={4} placeholder="Diagnosis, prescription, follow-up instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setNotesModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => updateStatus(notesModal._id, 'completed', notes)} style={{ flex: 1 }}>Mark Completed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
