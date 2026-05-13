import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ReceptionistBooking() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ patientId: '', doctorId: '', date: '', slotStart: '', slotEnd: '', reason: '' });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/users?role=patient&limit=100'),
      api.get('/doctors')
    ]).then(([pRes, dRes]) => {
      setPatients(pRes.data.users);
      setDoctors(dRes.data.profiles);
    });
  }, []);

  useEffect(() => {
    if (form.doctorId && form.date) {
      setLoadingSlots(true);
      setSelectedSlot(null);
      api.get(`/doctors/${form.doctorId}/slots?date=${form.date}`)
        .then(r => setSlots(r.data.available || []))
        .catch(() => setSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [form.doctorId, form.date]);

  const handleBook = async () => {
    if (!form.patientId || !form.doctorId || !form.date || !selectedSlot) return toast.error('Fill all required fields');
    setBooking(true);
    try {
      await api.post('/appointments', { ...form, patientId: form.patientId, doctorId: form.doctorId, slotStart: selectedSlot.start, slotEnd: selectedSlot.end });
      toast.success('Appointment booked');
      navigate('/receptionist/appointments');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setBooking(false); }
  };

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }));

  return (
    <div>
      <div className="flex-between mb-24">
        <div><h2 style={{ fontSize: 22 }}>Book for Patient</h2><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Create an appointment on behalf of a patient</p></div>
      </div>
      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="card-title">Patient & Doctor</h3>
            <div className="form-group">
              <label className="form-label">Select Patient *</label>
              <select className="form-control" value={form.patientId} onChange={set('patientId')} required>
                <option value="">-- Select patient --</option>
                {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName} — {p.email}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Select Doctor *</label>
              <select className="form-control" value={form.doctorId} onChange={set('doctorId')} required>
                <option value="">-- Select doctor --</option>
                {doctors.filter(d => d.isAcceptingAppointments).map(p => <option key={p.user?._id} value={p.user?._id}>Dr. {p.user?.firstName} {p.user?.lastName} — {p.specialization}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-control" type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={set('date')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea className="form-control" rows={3} value={form.reason} onChange={set('reason')} placeholder="Reason for visit..." />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="card-title">Select Time Slot</h3>
            {!form.doctorId || !form.date ? <div className="empty-state">Select doctor and date first</div>
              : loadingSlots ? <div className="flex-center" style={{ height: 100 }}><div className="spinner" /></div>
              : slots.length === 0 ? <div className="empty-state">No slots available</div>
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {slots.map(slot => (
                    <button key={slot.start} onClick={() => setSelectedSlot(slot)}
                      style={{ padding: '10px 8px', borderRadius: 8, border: `1.5px solid ${selectedSlot?.start === slot.start ? 'var(--primary)' : 'var(--border)'}`, background: selectedSlot?.start === slot.start ? 'var(--primary)' : 'var(--bg-main)', color: selectedSlot?.start === slot.start ? 'white' : 'var(--text-primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      {slot.start}
                    </button>
                  ))}
                </div>
              )}
          </div>

          {selectedSlot && (
            <div className="card" style={{ border: '2px solid var(--primary)' }}>
              <h3 className="card-title">Summary</h3>
              <div style={{ fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Date</span><strong>{new Date(form.date).toDateString()}</strong></div>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Time</span><strong>{selectedSlot.start} – {selectedSlot.end}</strong></div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} disabled={booking} onClick={handleBook}>
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
