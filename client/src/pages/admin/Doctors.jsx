import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [spec, setSpec] = useState('');
  const [specializations, setSpecializations] = useState([]);

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
    } catch { toast.error('Failed to load doctors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDoctors(); }, [search, spec]);

  const toggleAccepting = async (doctorUserId, current) => {
    try {
      await api.put('/doctors/profile', { isAcceptingAppointments: !current });
      toast.success('Updated');
      fetchDoctors();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 22 }}>Doctor Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>View and manage all registered doctors</p>
        </div>
        <a href="/admin/users" className="btn btn-primary">+ Add New Doctor</a>
      </div>

      <div className="card mb-24">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input className="form-control" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
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
              <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div className="avatar" style={{ width: 52, height: 52, fontSize: 18 }}>
                  {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Dr. {p.user?.firstName} {p.user?.lastName}</div>
                  <div style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>{p.specialization}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.registrationNumber}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                <div>🎓 {p.qualifications?.join(', ') || 'N/A'}</div>
                <div>📅 {p.experience} years experience</div>
                <div>💰 LKR {p.consultationFee?.toLocaleString()} / consult</div>
                <div>⭐ {p.rating} ({p.totalReviews} reviews)</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>Availability:</span>
                  <span className={`badge ${p.availability?.length > 0 ? 'badge-confirmed' : 'badge-cancelled'}`}>
                    {p.availability?.filter(a => a.isActive).length || 0} days/week
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <span className={`badge ${p.isAcceptingAppointments ? 'badge-confirmed' : 'badge-cancelled'}`}>
                  {p.isAcceptingAppointments ? '✓ Accepting' : '✗ Not Accepting'}
                </span>
                <span className={`badge ${p.user?.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                  {p.user?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
