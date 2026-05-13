import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function PatientDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [spec, setSpec] = useState('');
  const navigate = useNavigate();

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (spec) params.specialization = spec;
      const [docRes, specRes] = await Promise.all([
        api.get('/doctors', { params }),
        api.get('/doctors/specializations')
      ]);
      setDoctors(docRes.data.profiles);
      setSpecializations(specRes.data.specializations);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDoctors(); }, [search, spec]);

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 22 }}>Find a Doctor</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Browse our specialists and book an appointment</p>
        </div>
      </div>

      <div className="card mb-24">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input className="form-control" placeholder="Search by doctor name..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
          <select className="form-control" value={spec} onChange={e => setSpec(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">All Specializations</option>
            {specializations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {doctors.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>No doctors found</div>
          ) : doctors.map(p => (
            <div key={p._id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div className="avatar" style={{ width: 56, height: 56, fontSize: 20 }}>
                  {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Dr. {p.user?.firstName} {p.user?.lastName}</div>
                  <div style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>{p.specialization}</div>
                  <div style={{ fontSize: 13 }}>{'⭐'.repeat(Math.round(p.rating || 0))} <span style={{ color: 'var(--text-muted)' }}>({p.totalReviews})</span></div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.8 }}>
                <div>🎓 {p.qualifications?.[0] || 'N/A'}</div>
                <div>📅 {p.experience} years experience</div>
                <div>💰 LKR {p.consultationFee?.toLocaleString()} / consultation</div>
                {p.bio && <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>{p.bio.slice(0, 80)}...</div>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {p.isAcceptingAppointments && p.user?.isActive ? (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => navigate('/patient/book', { state: { doctorId: p.user?._id, doctorName: `Dr. ${p.user?.firstName} ${p.user?.lastName}`, spec: p.specialization, fee: p.consultationFee } })}
                  >
                    Book Appointment
                  </button>
                ) : (
                  <span className="badge badge-cancelled" style={{ padding: '8px 14px' }}>Not Accepting</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
