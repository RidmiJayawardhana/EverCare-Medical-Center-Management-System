import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function BookAppointment() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(state?.doctorId || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState(null);

  useEffect(() => {
    api.get('/doctors').then(r => setDoctors(r.data.profiles));
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      api.get(`/doctors/${selectedDoctor}`).then(r => setDoctorInfo(r.data.profile)).catch(() => {});
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      setLoadingSlots(true);
      setSelectedSlot(null);
      api.get(`/doctors/${selectedDoctor}/slots?date=${selectedDate}`)
        .then(r => setSlots(r.data.available || []))
        .catch(() => setSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedDoctor, selectedDate]);

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return toast.error('Please fill all fields');
    setBooking(true);
    try {
      const { data } = await api.post('/appointments', {
        doctorId: selectedDoctor,
        date: selectedDate,
        slotStart: selectedSlot.start,
        slotEnd: selectedSlot.end,
        reason,
      });
      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 22 }}>Book Appointment</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Select a doctor, date and time slot</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="card-title">Step 1: Choose Doctor</h3>
            <div className="form-group">
              <label className="form-label">Select Doctor</label>
              <select className="form-control" value={selectedDoctor} onChange={e => { setSelectedDoctor(e.target.value); setSlots([]); setSelectedSlot(null); }}>
                <option value="">-- Select a doctor --</option>
                {doctors.filter(p => p.isAcceptingAppointments && p.user?.isActive).map(p => (
                  <option key={p.user?._id} value={p.user?._id}>
                    Dr. {p.user?.firstName} {p.user?.lastName} — {p.specialization} (LKR {p.consultationFee?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            {doctorInfo && (
              <div style={{ padding: 14, background: 'var(--bg-main)', borderRadius: 10, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Dr. {doctorInfo.user?.firstName} {doctorInfo.user?.lastName}</div>
                <div style={{ color: 'var(--primary)' }}>{doctorInfo.specialization}</div>
                <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Fee: <strong>LKR {doctorInfo.consultationFee?.toLocaleString()}</strong></div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Step 2: Choose Date</h3>
            <input className="form-control" type="date" value={selectedDate} min={minDate} onChange={e => setSelectedDate(e.target.value)} disabled={!selectedDoctor} />
          </div>

          <div className="card">
            <h3 className="card-title">Step 3: Reason (Optional)</h3>
            <textarea className="form-control" rows={3} placeholder="Brief description of your symptoms or reason for visit..." value={reason} onChange={e => setReason(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="card-title">Available Time Slots</h3>
            {!selectedDoctor || !selectedDate ? (
              <div className="empty-state" style={{ padding: 40 }}>Select a doctor and date to see slots</div>
            ) : loadingSlots ? (
              <div className="flex-center" style={{ height: 120 }}><div className="spinner" /></div>
            ) : slots.length === 0 ? (
              <div className="empty-state">No slots available for this date</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {slots.map(slot => (
                  <button key={slot.start} onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: '10px 8px', borderRadius: 8, border: `1.5px solid ${selectedSlot?.start === slot.start ? 'var(--primary)' : 'var(--border)'}`,
                      background: selectedSlot?.start === slot.start ? 'var(--primary)' : 'var(--bg-main)',
                      color: selectedSlot?.start === slot.start ? 'white' : 'var(--text-primary)',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    {slot.start}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedSlot && doctorInfo && (
            <div className="card" style={{ border: '2px solid var(--primary)' }}>
              <h3 className="card-title">Booking Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Doctor</span><strong>Dr. {doctorInfo.user?.firstName} {doctorInfo.user?.lastName}</strong></div>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Specialization</span><strong>{doctorInfo.specialization}</strong></div>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Date</span><strong>{new Date(selectedDate).toDateString()}</strong></div>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Time</span><strong>{selectedSlot.start} – {selectedSlot.end}</strong></div>
                <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Consultation Fee</span>
                  <strong style={{ color: 'var(--primary)', fontSize: 16 }}>LKR {doctorInfo.consultationFee?.toLocaleString()}</strong>
                </div>
              </div>
              <button className="btn btn-primary btn-lg" disabled={booking} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={handleBook}>
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>Payment can be made after booking confirmation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
