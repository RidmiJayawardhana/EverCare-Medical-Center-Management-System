import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function DoctorSchedule() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const [slotsRes, apptRes] = await Promise.all([
        api.get(`/doctors/${user._id}/slots?date=${selectedDate}`),
        api.get('/appointments', { params: { date: selectedDate } }),
      ]);
      setSlots(slotsRes.data);
      setAppointments(apptRes.data.appointments);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSlots(); }, [selectedDate]);

  const getApptForSlot = (slotStart) => appointments.find(a => a.slotStart === slotStart);

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 22 }}>My Schedule</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>View your daily appointment slots</p>
        </div>
      </div>

      <div className="card mb-24">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Select Date:</label>
          <input className="form-control" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ maxWidth: 200 }} />
          {slots && <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{slots.day}</span>}
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : slots ? (
        <div className="card">
          <div className="flex-between mb-16">
            <h3 className="card-title" style={{ marginBottom: 0 }}>
              {slots.available?.length} / {slots.allSlots?.length} slots available
            </h3>
            <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--accent-green-light)', display: 'inline-block' }} /> Available</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: 'rgba(42,157,143,0.3)', display: 'inline-block' }} /> Booked</span>
            </div>
          </div>

          {slots.allSlots?.length === 0 ? (
            <div className="empty-state">No availability set for this day. <a href="/doctor/profile">Update schedule →</a></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {slots.allSlots?.map(slot => {
                const appt = getApptForSlot(slot.start);
                const isBooked = slots.booked?.includes(slot.start);
                return (
                  <div key={slot.start} style={{
                    padding: '14px 16px', borderRadius: 10,
                    background: isBooked ? 'rgba(42,157,143,0.08)' : 'var(--accent-green-light)',
                    border: `1.5px solid ${isBooked ? 'var(--primary)' : 'var(--accent-green)'}`,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary)', marginBottom: 4 }}>
                      {slot.start} – {slot.end}
                    </div>
                    {isBooked && appt ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{appt.patient?.firstName} {appt.patient?.lastName}</div>
                        <span className={`badge badge-${appt.status}`} style={{ marginTop: 4, fontSize: 11 }}>{appt.status}</span>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: '#388E3C' }}>Available</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">Select a date to view schedule</div>
        </div>
      )}
    </div>
  );
}
