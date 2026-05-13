import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#2A9D8F','#52B5E0','#81C784','#F4A261','#6C63FF','#FF6B6B','#4ECDC4','#45B7D1'];

export default function AccountantReports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments/summary').then(r => setSummary(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: 400 }}><div className="spinner" /></div>;

  const monthlyData = MONTHS.map((month, i) => {
    const found = summary?.revenueByMonth?.find(m => m._id.month === i + 1);
    return { month, revenue: found?.total || 0, transactions: found?.count || 0 };
  });

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 22 }}>Financial Reports</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Revenue analytics for {new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Revenue (All Time)', value: `LKR ${(summary?.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: '#66BB6A' },
          { label: 'Total Transactions', value: summary?.totalTransactions || 0, icon: '🧾', color: 'var(--primary)' },
          { label: 'This Month', value: `LKR ${(summary?.monthlyRevenue || 0).toLocaleString()}`, icon: '📅', color: 'var(--secondary)' },
          { label: 'Pending Payments', value: summary?.pendingPayments || 0, icon: '⏳', color: '#FFA726' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--bg-main)', fontSize: 22 }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: s.color, fontSize: 20 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-24">
        <h3 className="card-title">Monthly Revenue ({new Date().getFullYear()})</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => [`LKR ${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
            <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card mb-24">
        <h3 className="card-title">Monthly Transactions</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
            <Line type="monotone" dataKey="transactions" stroke="var(--secondary)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--secondary)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="card-title">Monthly Breakdown</h3>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Month</th><th>Revenue</th><th>Transactions</th><th>Avg per Transaction</th></tr></thead>
            <tbody>
              {monthlyData.filter(m => m.revenue > 0).map(m => (
                <tr key={m.month}>
                  <td style={{ fontWeight: 600 }}>{m.month}</td>
                  <td style={{ fontWeight: 700, color: '#66BB6A' }}>LKR {m.revenue.toLocaleString()}</td>
                  <td>{m.transactions}</td>
                  <td style={{ color: 'var(--text-muted)' }}>LKR {m.transactions ? Math.round(m.revenue / m.transactions).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {monthlyData.filter(m => m.revenue > 0).length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No revenue data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
