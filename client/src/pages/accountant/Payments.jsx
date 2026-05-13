import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AccountantPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await api.get('/payments', { params });
      setPayments(data.payments);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, [statusFilter, from, to]);

  const refund = async (id) => {
    const reason = prompt('Refund reason:');
    if (!reason) return;
    try {
      await api.post(`/payments/${id}/refund`, { reason });
      toast.success('Refund processed');
      fetchPayments();
    } catch { toast.error('Failed'); }
  };

  const totalShown = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 22 }}>Payment Records</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All financial transactions</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Shown total (completed)</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#66BB6A' }}>LKR {totalShown.toLocaleString()}</div>
        </div>
      </div>

      <div className="card mb-24">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">All Status</option>
            {['pending', 'completed', 'failed', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="form-control" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ maxWidth: 170 }} placeholder="From date" />
          <input className="form-control" type="date" value={to} onChange={e => setTo(e.target.value)} style={{ maxWidth: 170 }} placeholder="To date" />
          <button className="btn btn-secondary" onClick={() => { setStatusFilter(''); setFrom(''); setTo(''); }}>Clear</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Invoice</th><th>Patient</th><th>Doctor</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No payments found</td></tr>
                ) : payments.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{p.invoiceNumber || '—'}</td>
                    <td style={{ fontSize: 13 }}>{p.patient?.firstName} {p.patient?.lastName}</td>
                    <td style={{ fontSize: 13 }}>Dr. {p.doctor?.firstName} {p.doctor?.lastName}</td>
                    <td style={{ fontWeight: 700, color: '#66BB6A' }}>LKR {p.amount?.toLocaleString()}</td>
                    <td><span style={{ fontSize: 12, background: 'var(--bg-main)', padding: '3px 8px', borderRadius: 6 }}>{p.paymentMethod}</span></td>
                    <td><span className={`badge badge-${p.status === 'completed' ? 'confirmed' : p.status === 'failed' ? 'cancelled' : 'pending'}`}>{p.status}</span></td>
                    <td style={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>
                      {p.status === 'completed' && (
                        <button className="btn btn-sm btn-secondary" onClick={() => refund(p._id)}>Refund</button>
                      )}
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
