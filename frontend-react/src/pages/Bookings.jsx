import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';
import { Link } from 'react-router-dom';

const NPR_RATE = 133;

function StatusBadge({ status }) {
  const map = {
    pending:   { label: 'Pending',   bg: '#2a2010', color: '#f5a623', border: '#6b4a0e' },
    confirmed: { label: 'Confirmed', bg: '#0d2318', color: '#34d399', border: '#0a5c34' },
    paid:      { label: 'Paid ✓',    bg: '#0a1f2e', color: '#60c3f5', border: '#0c4a72' },
    cancelled: { label: 'Cancelled', bg: '#2a0d0d', color: '#f87171', border: '#7c2020' },
    rejected:  { label: 'Rejected',  bg: '#2a0d0d', color: '#f87171', border: '#7c2020' },
  };
  const s = map[status] || { label: status, bg: '#1a1a1a', color: '#aaa', border: '#333' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

function BookingCard({ b, index }) {
  const travelers = b.travelers || [];
  const totalNPR = (Number(b.total_usd) * NPR_RATE).toLocaleString();
  const isPaid = b.status === 'paid';
  const isRejected = b.status === 'rejected' || b.status === 'cancelled';
  const canPay = b.status === 'confirmed';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #141414 0%, #1a1a1a 100%)',
      border: '1px solid #2a2a2a',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      animation: `fadeUp 0.4s ease both`,
      animationDelay: `${index * 60}ms`,
      transition: 'border-color 0.2s, transform 0.2s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = '#3a3a3a';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = '#2a2a2a';
      e.currentTarget.style.transform = 'translateY(0)';
    }}>
      {/* Image + main info row */}
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Image */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={b.image_url || `https://picsum.photos/seed/${b.id}/400/300`}
            alt={b.title}
            style={{ width: 140, height: 120, objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, transparent 60%, #141414)',
          }}/>
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: '14px 16px 14px 12px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: '#f0ece4', lineHeight: 1.2, marginBottom: 2 }}>
                {b.title}
              </div>
              <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>📍</span>{b.destination}
              </div>
            </div>
            <StatusBadge status={b.status} />
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#666' }}>
              <span style={{ color: '#444', marginRight: 4 }}>Code</span>
              <span style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 12 }}>{b.booking_code}</span>
            </div>
            <div style={{ fontSize: 11, color: '#666' }}>
              <span style={{ color: '#444', marginRight: 4 }}>Travelers</span>
              <span style={{ color: '#aaa' }}>{travelers.length}</span>
            </div>
            <div style={{ fontSize: 11, color: '#666' }}>
              <span style={{ color: '#444', marginRight: 4 }}>Booked</span>
              <span style={{ color: '#aaa' }}>{new Date(b.created_at).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderTop: '1px solid #222',
        background: '#111',
      }}>
        {/* Price */}
        <div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#f0ece4' }}>
            NPR {totalNPR}
          </span>
          <span style={{ fontSize: 11, color: '#555', marginLeft: 6 }}>
            (${Number(b.total_usd).toFixed(2)})
          </span>
        </div>

        {/* Action button */}
        {isRejected ? (
          <span style={{ fontSize: 12, color: '#f87171', fontStyle: 'italic' }}>
            Not available
          </span>
        ) : isPaid ? (
          <Link to={`/payment/${b.id}`} style={{
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: 'transparent',
            border: '1px solid #2a2a2a',
            color: '#60c3f5',
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}>
            View receipt →
          </Link>
        ) : canPay ? (
          <Link to={`/payment/${b.id}`} style={{
            padding: '8px 20px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #f5a623, #e8901a)',
            border: 'none',
            color: '#1a0e00',
            textDecoration: 'none',
            letterSpacing: '0.04em',
            boxShadow: '0 0 16px rgba(245,166,35,0.25)',
          }}>
            Pay now →
          </Link>
        ) : (
          <span style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>
            Awaiting agency
          </span>
        )}
      </div>
    </div>
  );
}

export default function Bookings() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setMsg('');
    if (!getToken()) { setMsg('Please login first.'); setLoading(false); return; }
    try {
      const res = await api.get('/api/bookings');
      setItems(res.data.items || []);
    } catch {
      setMsg('Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = {
    total: items.length,
    paid: items.filter(b => b.status === 'paid').length,
    pending: items.filter(b => b.status === 'pending').length,
    confirmed: items.filter(b => b.status === 'confirmed').length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>

        {/* Header */}
        <div style={{
          padding: '28px 0 20px',
          animation: 'fadeUp 0.3s ease both',
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28,
            fontWeight: 700,
            color: '#f0ece4',
            margin: '0 0 4px',
          }}>
            My Bookings
          </h2>
          <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
            Your travel history and upcoming trips
          </p>
        </div>

        {/* Stats strip */}
        {items.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginBottom: 20,
            animation: 'fadeUp 0.35s ease both',
            animationDelay: '60ms',
          }}>
            {[
              { label: 'Total',     value: stats.total,     color: '#aaa' },
              { label: 'Confirmed', value: stats.confirmed, color: '#34d399' },
              { label: 'Pending',   value: stats.pending,   color: '#f5a623' },
              { label: 'Paid',      value: stats.paid,      color: '#60c3f5' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#141414',
                border: '1px solid #222',
                borderRadius: 10,
                padding: '10px 14px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* States */}
        {msg && (
          <div style={{
            background: '#1a1010', border: '1px solid #3a1a1a', borderRadius: 12,
            padding: '16px 20px', color: '#f87171', fontSize: 14,
          }}>
            {msg}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
            <div style={{ fontSize: 13, animation: 'pulse 1.4s ease infinite' }}>Loading bookings...</div>
          </div>
        )}

        {!loading && !msg && items.length === 0 && (
          <div style={{
            background: '#141414', border: '1px solid #222', borderRadius: 16,
            padding: '48px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🧳</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#666', marginBottom: 6 }}>No bookings yet</div>
            <div style={{ fontSize: 13, color: '#444' }}>Explore tours and book your first trip!</div>
          </div>
        )}

        {/* Booking cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((b, i) => (
            <BookingCard key={b.id} b={b} index={i} />
          ))}
        </div>
      </div>
    </>
  );
}