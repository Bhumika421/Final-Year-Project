import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function PendingAgencies() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [actioningId, setActioningId] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/agencies/pending');
      setAgencies(res.data.items || []);
    } catch {
      setMsg({ text: 'Failed to load agencies.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id, status) => {
    setActioningId(id);
    try {
      await api.post(`/api/admin/agencies/${id}/verify`, { status });
      setMsg({
        text: status === 'verified' ? 'Agency approved successfully! ✅' : 'Agency rejected. ❌',
        type: status === 'verified' ? 'success' : 'error'
      });
      fetchPending();
    } catch {
      setMsg({ text: 'Action failed. Please try again.', type: 'error' });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Pending Agency Approvals</h2>
        <span style={{
          background: agencies.length > 0 ? '#f59e0b' : '#22c55e',
          color: '#fff',
          borderRadius: 999,
          padding: '2px 12px',
          fontSize: 13,
          fontWeight: 600
        }}>
          {agencies.length} pending
        </span>
      </div>

      {msg.text && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 8,
          marginBottom: 16,
          background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'success' ? '#166534' : '#991b1b',
          fontSize: 14
        }}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading agencies...</p>
      ) : agencies.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 0',
          color: '#6b7280',
          border: '1px dashed #d1d5db',
          borderRadius: 12
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <p style={{ margin: 0 }}>No pending agencies — all caught up!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.04)', borderBottom: '2px solid #e5e7eb' }}>
                {['Name', 'Email', 'Business', 'License No', 'Registered', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agencies.map((a, i) => (
                <tr
                  key={a.id}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'
                  }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 500 }}>{a.full_name}</td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>{a.email}</td>
                  <td style={{ padding: '12px 14px' }}>{a.business_name || '—'}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 13 }}>{a.license_no || '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <button
                      disabled={actioningId === a.id}
                      onClick={() => handleAction(a.id, 'verified')}
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 13,
                        marginRight: 8,
                        opacity: actioningId === a.id ? 0.6 : 1
                      }}
                    >
                      Approve
                    </button>
                    <button
                      disabled={actioningId === a.id}
                      onClick={() => handleAction(a.id, 'rejected')}
                      style={{
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 13,
                        opacity: actioningId === a.id ? 0.6 : 1
                      }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}