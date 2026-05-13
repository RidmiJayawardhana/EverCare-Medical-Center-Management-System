import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Stars = ({ rating }) => '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/feedback');
      setFeedbacks(data.feedbacks);
    } catch { toast.error('Failed to load feedback'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFeedback(); }, []);

  const toggle = async (id) => {
    try {
      await api.put(`/feedback/${id}/toggle`);
      toast.success('Visibility updated');
      fetchFeedback();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h2 style={{ fontSize: 22 }}>Feedback & Reviews</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage patient reviews for doctors</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {feedbacks.length === 0 ? (
            <div className="empty-state">No feedback yet</div>
          ) : feedbacks.map(f => (
            <div key={f._id} className="card" style={{ padding: 20 }}>
              <div className="flex-between">
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div className="avatar">{f.patient?.firstName?.[0]}{f.patient?.lastName?.[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{f.patient?.firstName} {f.patient?.lastName}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      for Dr. {f.doctor?.firstName} {f.doctor?.lastName}
                    </div>
                    <div style={{ fontSize: 18, margin: '4px 0' }}><Stars rating={f.rating} /></div>
                    {f.comment && <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>{f.comment}</p>}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(f.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${f.isVisible ? 'badge-confirmed' : 'badge-cancelled'}`}>
                    {f.isVisible ? 'Visible' : 'Hidden'}
                  </span>
                  <button className="btn btn-sm btn-secondary" onClick={() => toggle(f._id)}>
                    {f.isVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
