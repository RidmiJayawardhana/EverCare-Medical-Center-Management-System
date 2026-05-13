import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AccountantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/accountant').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: 400 }}><div className="spinner" /></div>;

  const { stats, recentPayments, revenueByDoctor } = data || {};

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 24 }}>Accounts Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Financial overview · {new Date().toDateString()}</p>
        </div>
        <Link to="/accountant/reports" className="btn btn-primary">View Reports</Link>
      </div>

      <div className="stats-grid">
        {[
          { label: "This Month's Revenue", value: `LKR ${(stats?.monthlyRevenue || 0).toLocaleString()}`, icon: '💰', color: '#66BB6A' },
          { label: 'Monthly Transactions', value: stats?.monthlyTransactions || 0, icon: '🧾', color: 'var(--primary)' },
          { label: 'Pending Payments', value: stats?.pendingPayments || 0, icon: '⏳', color: '#FFA726' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--bg-main)', fontSize: 24 }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="flex-between mb-16">
            <h3 className="card-title" style={{ marginBottom: 0 }}>Recent Payments</h3>
            <Link to="/accountant/payments" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>
          </div>
          {recentPayments?.length === 0 ? (
            <div className="empty-state">No payments yet</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Patient</th><th>Amount</th><th>Date</th><th>Invoice</th></tr></thead>
                <tbody>
                  {recentPayments?.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontSize: 13 }}>{p.patient?.firstName} {p.patient?.lastName}</td>
                      <td style={{ fontWeight: 700, color: '#66BB6A' }}>LKR {p.amount?.toLocaleString()}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontSize: 12 }}>{p.invoiceNumber || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Top Earning Doctors</h3>
          {revenueByDoctor?.length === 0 ? (
            <div className="empty-state">No data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {revenueByDoctor?.map((d, i) => (
                <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Dr. {d.doctor?.firstName} {d.doctor?.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.count} consultations</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#66BB6A' }}>LKR {d.total?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
