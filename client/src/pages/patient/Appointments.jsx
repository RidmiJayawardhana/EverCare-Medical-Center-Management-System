import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [payModal, setPayModal] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const [paying, setPaying] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/appointments', { params });
      setAppointments(data.appointments);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, [statusFilter]);

  const initiatePayment = async (appointmentId) => {
    setPaying(true);
    try {
      const { data } = await api.post('/payments/initiate', { appointmentId });
      setPayModal({ paymentId: data.paymentId, payhereData: data.payhereData, appointmentId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    } finally { setPaying(false); }
  };

  const mockPay = async (paymentId) => {
    try {
      await api.post('/payments/mock-complete', { paymentId });
      toast.success('Payment successful! (Mock)');
      setPayModal(null);
      fetchAppointments();
    } catch { toast.error('Payment failed'); }
  };

  const cancelAppt = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.put(`/appointments/${id}/cancel`, { reason: 'Cancelled by patient' });
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch { toast.error('Failed to cancel'); }
  };

  const submitFeedback = async () => {
    try {
      await api.post('/feedback', { appointmentId: feedbackModal._id, ...feedback });
      toast.success('Review submitted!');
      setFeedbackModal(null);
      fetchAppointments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 22 }}>My Appointments</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>View and manage your appointments</p>
        </div>
      </div>

      <div className="card mb-24">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: '6px 16px', borderRadius: 20, border: `1.5px solid ${statusFilter === s ? 'var(--primary)' : 'var(--border)'}`, background: statusFilter === s ? 'var(--primary)' : 'white', color: statusFilter === s ? 'white' : 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {appointments.length === 0 ? (
            <div className="empty-state">No appointments found</div>
          ) : appointments.map(a => (
            <div key={a._id} className="card" style={{ padding: 20 }}>
              <div className="flex-between">
                <div style={{ display: 'flex', gap: 14 }}>
                  <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>🩺</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(a.date).toDateString()} · {a.slotStart} – {a.slotEnd}</div>
                    {a.reason && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Reason: {a.reason}</div>}
                    {a.notes && <div style={{ fontSize: 13, color: 'var(--primary)', marginTop: 4, padding: '6px 10px', background: 'rgba(42,157,143,0.06)', borderRadius: 6 }}>📋 {a.notes}</div>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: 8 }}>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>LKR {a.consultationFee?.toLocaleString()}</div>
                  <span className={`badge badge-${a.paymentStatus}`} style={{ marginTop: 4 }}>{a.paymentStatus}</span>
                </div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {a.status === 'confirmed' && a.paymentStatus === 'unpaid' && (
                  <button className="btn btn-primary btn-sm" onClick={() => initiatePayment(a._id)} disabled={paying}>💳 Pay Now</button>
                )}
                {a.status === 'completed' && !a.feedbackGiven && (
                  <button className="btn btn-outline btn-sm" onClick={() => setFeedbackModal(a)}>⭐ Leave Review</button>
                )}
                {['pending', 'confirmed'].includes(a.status) && (
                  <button className="btn btn-secondary btn-sm" onClick={() => cancelAppt(a._id)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 36, maxWidth: 480, width: '100%' }}>
            <h3 style={{ marginBottom: 8 }}>Complete Payment</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>PayHere integration is configured. In production, clicking "Pay with PayHere" will redirect to the PayHere checkout page.</p>

            <div style={{ background: 'var(--bg-main)', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13 }}>
              <div className="flex-between" style={{ marginBottom: 8 }}><span>Order ID</span><strong>{payModal.paymentId}</strong></div>
              <div className="flex-between" style={{ marginBottom: 8 }}><span>Amount</span><strong>LKR {payModal.payhereData?.amount}</strong></div>
              <div className="flex-between"><span>Merchant ID</span><strong>{payModal.payhereData?.merchant_id || 'Set in .env'}</strong></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  if (payModal.payhereData?.merchant_id && payModal.payhereData.merchant_id !== 'your_merchant_id') {
                    const form = document.createElement('form');
                    form.method = 'POST'; form.action = payModal.payhereData.checkout_url;
                    Object.entries(payModal.payhereData).forEach(([k, v]) => {
                      if (k !== 'checkout_url') { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; form.appendChild(i); }
                    });
                    document.body.appendChild(form); form.submit();
                  } else {
                    toast.error('PayHere not configured. Use Mock Payment below.');
                  }
                }}>
                💳 Pay with PayHere
              </button>
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => mockPay(payModal.paymentId)}>
                🧪 Mock Payment (Dev Only)
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setPayModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 36, maxWidth: 420, width: '100%' }}>
            <h3 style={{ marginBottom: 8 }}>Leave a Review</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Rate your appointment with Dr. {feedbackModal.doctor?.firstName} {feedbackModal.doctor?.lastName}</p>
            <div className="form-group">
              <label className="form-label">Rating</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setFeedback(f => ({ ...f, rating: n }))}
                    style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', opacity: feedback.rating >= n ? 1 : 0.3 }}>⭐</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Comment (optional)</label>
              <textarea className="form-control" rows={3} placeholder="Share your experience..." value={feedback.comment} onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setFeedbackModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={submitFeedback} style={{ flex: 1 }}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
