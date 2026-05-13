import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLES = ['doctor', 'receptionist', 'accountant', 'admin'];

const emptyForm = { firstName: '', lastName: '', username: '', email: '', password: 'Password@123', phone: '', role: 'receptionist', specialization: '', consultationFee: '', experience: '', qualifications: '', bio: '', registrationNumber: '' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/users', { params });
      setUsers(data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (form.qualifications) payload.qualifications = form.qualifications.split(',').map(s => s.trim());
      await api.post('/users', payload);
      toast.success('User created successfully');
      setShowModal(false);
      setForm(emptyForm);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (user) => {
    try {
      if (user.isActive) {
        await api.delete(`/users/${user._id}`);
        toast.success('User deactivated');
      } else {
        await api.put(`/users/${user._id}`, { isActive: true });
        toast.success('User activated');
      }
      fetchUsers();
    } catch { toast.error('Failed to update'); }
  };

  const set = f => e => setForm({ ...form, [f]: e.target.value });

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 22 }}>User Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage all staff and patient accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Staff User</button>
      </div>

      <div className="card mb-24">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input className="form-control" placeholder="Search name, email, username..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
          <select className="form-control" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Roles</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="accountant">Accountant</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchUsers}>Refresh</button>
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
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</td></tr>
                ) : users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.username}</td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td style={{ fontSize: 13 }}>{u.phone || '—'}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleActive(u)}
                        style={{ fontSize: 12 }}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: 36 }}>
            <div className="flex-between mb-24">
              <h3>Create Staff Account</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-control" value={form.firstName} onChange={set('firstName')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-control" value={form.lastName} onChange={set('lastName')} required />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-control" value={form.username} onChange={set('username')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" value={form.role} onChange={set('role')}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={set('email')} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={set('phone')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Temp Password</label>
                  <input className="form-control" value={form.password} onChange={set('password')} required />
                </div>
              </div>
              {form.role === 'doctor' && (
                <>
                  <div style={{ margin: '16px 0 12px', padding: '12px 16px', background: 'var(--bg-main)', borderRadius: 10, fontSize: 13, color: 'var(--primary)' }}>
                    🩺 Doctor-specific fields
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Specialization</label>
                      <input className="form-control" value={form.specialization} onChange={set('specialization')} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Consultation Fee (LKR)</label>
                      <input className="form-control" type="number" value={form.consultationFee} onChange={set('consultationFee')} required />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Experience (years)</label>
                      <input className="form-control" type="number" value={form.experience} onChange={set('experience')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Registration No.</label>
                      <input className="form-control" value={form.registrationNumber} onChange={set('registrationNumber')} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Qualifications (comma-separated)</label>
                    <input className="form-control" placeholder="MBBS, MD Cardiology" value={form.qualifications} onChange={set('qualifications')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea className="form-control" rows={3} value={form.bio} onChange={set('bio')} />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
