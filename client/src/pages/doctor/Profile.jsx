import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('personal');

  useEffect(() => {
    api.get(`/doctors/${user._id}`).then(r => {
      setProfile(r.data.profile);
      const p = r.data.profile;
      setForm({
        firstName: user.firstName, lastName: user.lastName, phone: user.phone || '',
        specialization: p?.specialization || '', consultationFee: p?.consultationFee || 0,
        experience: p?.experience || 0, bio: p?.bio || '',
        registrationNumber: p?.registrationNumber || '',
        qualifications: p?.qualifications?.join(', ') || '',
        isAcceptingAppointments: p?.isAcceptingAppointments ?? true,
        availability: p?.availability || [],
      });
    }).catch(() => toast.error('Failed to load profile'));
  }, []);

  const toggleDay = (day) => {
    const exists = form.availability?.find(a => a.day === day);
    if (exists) {
      setForm(f => ({ ...f, availability: f.availability.map(a => a.day === day ? { ...a, isActive: !a.isActive } : a) }));
    } else {
      setForm(f => ({ ...f, availability: [...(f.availability || []), { day, startTime: '09:00', endTime: '17:00', isActive: true }] }));
    }
  };

  const updateSlot = (day, field, value) => {
    setForm(f => ({ ...f, availability: f.availability.map(a => a.day === day ? { ...a, [field]: value } : a) }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', { firstName: form.firstName, lastName: form.lastName, phone: form.phone });
      await api.put('/doctors/profile', {
        specialization: form.specialization, consultationFee: Number(form.consultationFee),
        experience: Number(form.experience), bio: form.bio,
        registrationNumber: form.registrationNumber,
        qualifications: form.qualifications.split(',').map(s => s.trim()).filter(Boolean),
        isAcceptingAppointments: form.isAcceptingAppointments,
        availability: form.availability,
      });
      updateUser({ firstName: form.firstName, lastName: form.lastName });
      toast.success('Profile updated');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (!profile && !form.specialization) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  const tabStyle = (t) => ({ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, background: tab === t ? 'var(--primary)' : 'var(--bg-main)', color: tab === t ? 'white' : 'var(--text-secondary)', fontSize: 14, transition: 'all 0.2s' });

  return (
    <div>
      <div className="flex-between mb-24">
        <div><h2 style={{ fontSize: 22 }}>My Profile</h2><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Update your personal and professional information</p></div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['personal', 'professional', 'availability'].map(t => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'personal' && (
        <div className="card">
          <h3 className="card-title">Personal Information</h3>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">First Name</label><input className="form-control" value={form.firstName || ''} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Last Name</label><input className="form-control" value={form.lastName || ''} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div className="form-group">
            <label className="form-label">Accepting Appointments</label>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {[true, false].map(v => (
                <button key={String(v)} type="button"
                  style={{ padding: '8px 20px', borderRadius: 8, border: `1.5px solid ${v ? 'var(--primary)' : '#EF5350'}`, background: form.isAcceptingAppointments === v ? (v ? 'var(--primary)' : '#EF5350') : 'white', color: form.isAcceptingAppointments === v ? 'white' : (v ? 'var(--primary)' : '#EF5350'), fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setForm(f => ({ ...f, isAcceptingAppointments: v }))}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'professional' && (
        <div className="card">
          <h3 className="card-title">Professional Information</h3>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Specialization</label><input className="form-control" value={form.specialization || ''} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Consultation Fee (LKR)</label><input className="form-control" type="number" value={form.consultationFee || ''} onChange={e => setForm(f => ({ ...f, consultationFee: e.target.value }))} /></div>
          </div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Experience (years)</label><input className="form-control" type="number" value={form.experience || ''} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Registration No.</label><input className="form-control" value={form.registrationNumber || ''} onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Qualifications (comma-separated)</label><input className="form-control" value={form.qualifications || ''} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Bio</label><textarea className="form-control" rows={4} value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} /></div>
        </div>
      )}

      {tab === 'availability' && (
        <div className="card">
          <h3 className="card-title">Weekly Availability</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Set your available days and hours. 30-minute slots will be generated automatically.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {DAYS.map(day => {
              const slot = form.availability?.find(a => a.day === day);
              const active = slot?.isActive ?? false;
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: active ? 'rgba(42,157,143,0.05)' : 'var(--bg-main)', borderRadius: 10, border: `1px solid ${active ? 'var(--border)' : 'transparent'}` }}>
                  <button type="button" onClick={() => toggleDay(day)} style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`, background: active ? 'var(--primary)' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, flexShrink: 0 }}>
                    {active ? '✓' : ''}
                  </button>
                  <span style={{ width: 100, fontWeight: 600, fontSize: 14 }}>{day}</span>
                  {active && (
                    <>
                      <input type="time" value={slot?.startTime || '09:00'} onChange={e => updateSlot(day, 'startTime', e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13 }} />
                      <span style={{ color: 'var(--text-muted)' }}>to</span>
                      <input type="time" value={slot?.endTime || '17:00'} onChange={e => updateSlot(day, 'endTime', e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13 }} />
                    </>
                  )}
                  {!active && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Not available</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
