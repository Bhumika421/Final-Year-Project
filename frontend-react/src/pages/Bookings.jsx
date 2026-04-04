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
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

// ── Edit Modal
function EditModal({ booking, onClose, onSave }) {
  const [travelers, setTravelers] = useState(
    booking.travelers?.length > 0
      ? booking.travelers.map(t => ({ name: t.name || '', age: t.age || '', contact: t.contact || '' }))
      : [{ name: '', age: '', contact: '' }]
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);

  function setTraveler(i, k, v) {
    if (k === 'contact') v = v.replace(/\D/g, '');
    setTravelers(prev => prev.map((t, idx) => idx === i ? { ...t, [k]: v } : t));

    if (k === 'contact') {
      setFieldErrors(prev => {
        const updated = [...prev];
        if (!updated[i]) updated[i] = {};
        updated[i].contact = v.length > 0 && v.length !== 10 ? 'Please enter a valid 10-digit number.' : '';
        return updated;
      });
    } else {
      setFieldErrors(prev => {
        const updated = [...prev];
        if (updated[i]) updated[i] = { ...updated[i], [k]: '' };
        return updated;
      });
    }
  }

  async function save() {
    setErr('');
    // Validate
    let hasError = false;
    const errors = travelers.map((t, i) => {
      const e = { name: '', contact: '' };
      if (!t.name.trim()) { e.name = 'Name is required.'; if (!hasError) { setErr(`Traveler ${i+1}: Name is required.`); hasError = true; } }
      const c = t.contact.replace(/\s/g, '');
      if (!c) { e.contact = 'Contact is required.'; if (!hasError) { setErr(`Traveler ${i+1}: Contact is required.`); hasError = true; } }
      else if (!/^\d{10}$/.test(c)) { e.contact = 'Must be 10 digits.'; if (!hasError) { setErr(`Traveler ${i+1}: Please enter a valid 10-digit number.`); hasError = true; } }
      return e;
    });
    setFieldErrors(errors);
    if (hasError) return;

    setSaving(true);
    try {
      await api.put(`/api/bookings/${booking.id}`, { travelers });
      onSave();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#141414', border: '1px solid #2a2a2a', borderRadius: 18,
        padding: 28, width: '100%', maxWidth: 480, maxHeight: '85vh',
        overflowY: 'auto', animation: 'fadeUp 0.25s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#f0ece4' }}>Edit Booking</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>#{booking.booking_code}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#888', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Travelers */}
        {travelers.map((t, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #222', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a8d96b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Traveler {i + 1}</div>
              {i > 0 && (
                <button onClick={() => setTravelers(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>
                  Remove
                </button>
              )}
            </div>

            {/* Name */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Name *</div>
              <input
                value={t.name}
                onChange={e => setTraveler(i, 'name', e.target.value)}
                placeholder="Ram Sharma"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${fieldErrors[i]?.name ? 'rgba(248,113,113,0.5)' : '#2a2a2a'}`,
                  borderRadius: 8, padding: '10px 14px', color: '#f0ede8',
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
              {fieldErrors[i]?.name && <div style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>⚠ {fieldErrors[i].name}</div>}
            </div>

            {/* Age */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Age</div>
              <input
                value={t.age}
                onChange={e => setTraveler(i, 'age', e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="25"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid #2a2a2a', borderRadius: 8,
                  padding: '10px 14px', color: '#f0ede8', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Contact */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Contact *</div>
              <input
                value={t.contact}
                onChange={e => setTraveler(i, 'contact', e.target.value)}
                placeholder="98XXXXXXXX"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${fieldErrors[i]?.contact ? 'rgba(248,113,113,0.5)' : '#2a2a2a'}`,
                  borderRadius: 8, padding: '10px 14px', color: '#f0ede8',
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
              {fieldErrors[i]?.contact && <div style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>⚠ {fieldErrors[i].contact}</div>}
            </div>
          </div>
        ))}

        {travelers.length < 6 && (
          <button onClick={() => setTravelers(prev => [...prev, { name: '', age: '', contact: '' }])}
            style={{ width: '100%', background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 10, padding: 10, color: '#555', fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
            + Add Traveler
          </button>
        )}

        {err && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
            {err}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 100, padding: '11px', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} style={{ flex: 2, background: saving ? 'rgba(168,217,107,0.5)' : '#a8d96b', border: 'none', borderRadius: 100, padding: '11px', color: '#0a0e0d', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal
function DeleteModal({ booking, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState('');

  async function confirm() {
    setDeleting(true);
    try {
      await api.delete(`/api/bookings/${booking.id}`);
      onDelete();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Delete failed. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#141414', border: '1px solid #3a1a1a', borderRadius: 18,
        padding: 28, width: '100%', maxWidth: 380, animation: 'fadeUp 0.25s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#f0ece4', marginBottom: 8 }}>Delete Booking?</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
            Are you sure you want to delete booking <span style={{ color: '#aaa', fontFamily: 'monospace' }}>#{booking.booking_code}</span>? This cannot be undone.
          </div>
        </div>

        {err && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 100, padding: '11px', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={confirm} disabled={deleting} style={{ flex: 1, background: deleting ? 'rgba(248,113,113,0.4)' : '#ef4444', border: 'none', borderRadius: 100, padding: '11px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer' }}>
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Booking Card
function BookingCard({ b, index, onEdit, onDelete }) {
  const travelers = b.travelers || [];
  const totalNPR = (Number(b.total_usd) * NPR_RATE).toLocaleString();
  const isPaid = b.status === 'paid';
  const isRejected = b.status === 'rejected' || b.status === 'cancelled';
  const canPay = b.status === 'confirmed';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #141414 0%, #1a1a1a 100%)',
      border: '1px solid #2a2a2a', borderRadius: 16, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      animation: `fadeUp 0.4s ease both`, animationDelay: `${index * 60}ms`,
      transition: 'border-color 0.2s, transform 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.transform = 'translateY(0)'; }}>

      {/* Image + main info row */}
      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={b.image_url || `https://picsum.photos/seed/${b.id}/400/300`}
            alt={b.title}
            style={{ width: 140, height: 120, objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, #141414)' }}/>
        </div>

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
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderTop: '1px solid #222', background: '#111', gap: 8, flexWrap: 'wrap',
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

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Edit button */}
          <button onClick={() => onEdit(b)} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: 'rgba(168,217,107,0.08)', border: '1px solid rgba(168,217,107,0.2)',
            color: '#a8d96b', cursor: 'pointer', transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,217,107,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,217,107,0.08)'}>
            ✏ Edit
          </button>

          {/* Delete button */}
          <button onClick={() => onDelete(b)} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            color: '#f87171', cursor: 'pointer', transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}>
            🗑 Delete
          </button>

          {/* Pay/View button */}
          {isRejected ? (
            <span style={{ fontSize: 12, color: '#f87171', fontStyle: 'italic' }}>Not available</span>
          ) : isPaid ? (
            <Link to={`/payment/${b.id}`} style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'transparent', border: '1px solid #2a2a2a',
              color: '#60c3f5', textDecoration: 'none', letterSpacing: '0.04em',
            }}>
              View receipt →
            </Link>
          ) : canPay ? (
            <Link to={`/payment/${b.id}`} style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: 'linear-gradient(135deg, #f5a623, #e8901a)', border: 'none',
              color: '#1a0e00', textDecoration: 'none', letterSpacing: '0.04em',
              boxShadow: '0 0 16px rgba(245,166,35,0.25)',
            }}>
              Pay now →
            </Link>
          ) : (
            <span style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>Awaiting agency</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component
export default function Bookings() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [editBooking, setEditBooking] = useState(null);
  const [deleteBooking, setDeleteBooking] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

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

  function showSuccess(text) {
    setSuccessMsg(text);
    setTimeout(() => setSuccessMsg(''), 3500);
  }

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
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      {/* Edit Modal */}
      {editBooking && (
        <EditModal
          booking={editBooking}
          onClose={() => setEditBooking(null)}
          onSave={() => {
            setEditBooking(null);
            showSuccess('Booking updated successfully! ✓');
            load();
          }}
        />
      )}

      {/* Delete Modal */}
      {deleteBooking && (
        <DeleteModal
          booking={deleteBooking}
          onClose={() => setDeleteBooking(null)}
          onDelete={() => {
            setDeleteBooking(null);
            showSuccess('Booking deleted successfully! ✓');
            load();
          }}
        />
      )}

      {/* Success Toast */}
      {successMsg && (
        <div style={{
          position: 'fixed', top: 80, right: 24, background: '#1a2e1a',
          border: '1px solid rgba(168,217,107,0.4)', color: '#a8d96b',
          borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600,
          zIndex: 9998, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'toastIn 0.4s ease',
        }}>
          {successMsg}
        </div>
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>

        {/* Header */}
        <div style={{ padding: '28px 0 20px', animation: 'fadeUp 0.3s ease both' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#f0ece4', margin: '0 0 4px' }}>
            My Bookings
          </h2>
          <p style={{ fontSize: 13, color: '#555', margin: 0 }}>Your travel history and upcoming trips</p>
        </div>

        {/* Stats strip */}
        {items.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
            marginBottom: 20, animation: 'fadeUp 0.35s ease both', animationDelay: '60ms',
          }}>
            {[
              { label: 'Total',     value: stats.total,     color: '#aaa' },
              { label: 'Confirmed', value: stats.confirmed, color: '#34d399' },
              { label: 'Pending',   value: stats.pending,   color: '#f5a623' },
              { label: 'Paid',      value: stats.paid,      color: '#60c3f5' },
            ].map(s => (
              <div key={s.label} style={{ background: '#141414', border: '1px solid #222', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {msg && (
          <div style={{ background: '#1a1010', border: '1px solid #3a1a1a', borderRadius: 12, padding: '16px 20px', color: '#f87171', fontSize: 14 }}>
            {msg}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
            <div style={{ fontSize: 13, animation: 'pulse 1.4s ease infinite' }}>Loading bookings...</div>
          </div>
        )}

        {/* Empty */}
        {!loading && !msg && items.length === 0 && (
          <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🧳</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#666', marginBottom: 6 }}>No bookings yet</div>
            <div style={{ fontSize: 13, color: '#444' }}>Explore tours and book your first trip!</div>
          </div>
        )}

        {/* Booking cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((b, i) => (
            <BookingCard
              key={b.id}
              b={b}
              index={i}
              onEdit={setEditBooking}
              onDelete={setDeleteBooking}
            />
          ))}
        </div>
      </div>
    </>
  );
}